import mysql.connector
from datetime import datetime

def calculate_priority_score(patient_data):
    """
    Calculate priority score (1-10) based on medical factors.
    
    Based on queuing theory documentation:
    - Triage Level (40%): red=4, orange=3, yellow=2, green=1
    - Medical Conditions (30%): heart_disease=+1.5, hypertension=+0.75, chest_pain>=3=+0.75
    - Vital Signs (20%): BP critical=+1.0, HR abnormal=+0.5, glucose emergency=+0.5
    - Age Factor (10%): >75=+0.7, >65=+0.5, <5=+0.5
    """
    score = 0.0
    
    # 1. Triage Level (40% weight)
    triage_scores = {
        'red': 4.0,
        'orange': 3.0,
        'yellow': 2.0,
        'green': 1.0
    }
    triage = patient_data.get('triage', 'yellow').lower()
    score += triage_scores.get(triage, 2.0)
    
    # 2. Medical Conditions (30% weight)
    if patient_data.get('heart_disease', 0) == 1:
        score += 1.5
    if patient_data.get('hypertension', 0) == 1:
        score += 0.75
    
    # Chest pain severity
    chest_pain = patient_data.get('chest_pain_type', 0)
    if chest_pain >= 3:
        score += 0.75
    
    # 3. Vital Signs (20% weight)
    bp = patient_data.get('blood_pressure', 120)
    if bp > 180 or bp < 90:
        score += 1.0
    
    hr = patient_data.get('max_heart_rate', 80)
    if hr > 120 or hr < 50:
        score += 0.5
    
    glucose = patient_data.get('plasma_glucose', 100)
    if glucose > 250 or glucose < 50:
        score += 0.5
    
    # 4. Age Factor (10% weight)
    age = patient_data.get('age', 30)
    if age > 75:
        score += 0.7
    elif age > 65:
        score += 0.5
    elif age < 5:
        score += 0.5
    
    # Cap between 1.0 and 10.0
    final_score = min(max(round(score, 1), 1.0), 10.0)
    return final_score


def get_db_connection():
    """Get MySQL database connection using .env credentials"""
    import os
    from dotenv import load_dotenv
    
    load_dotenv()
    
    return mysql.connector.connect(
        host=os.getenv('DB_HOST'),
        user=os.getenv('DB_USER'),
        password=os.getenv('DB_PASSWORD'),
        database=os.getenv('DB_NAME'),
        port=int(os.getenv('DB_PORT', 3306))
    )


def assign_to_queue(patient_id, ward_name, priority_score, ml_confidence):
    """
    Assign patient to ward queue and bed.
    
    Returns dict with:
    - success: bool
    - ward_name: str
    - bed_number: str
    - ward_id: int
    - priority_score: float
    - queue_position: int
    - estimated_wait: int (minutes)
    """
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    try:
        # 1. Get ward details
        cursor.execute("""
            SELECT ward_id, available_beds 
            FROM wards 
            WHERE ward_name = %s
        """, (ward_name,))
        
        ward_data = cursor.fetchone()
        
        if not ward_data:
            return {'success': False, 'message': f'Ward {ward_name} not found'}
        
        ward_id = ward_data['ward_id']
        available_beds = ward_data['available_beds']
        
        if available_beds <= 0:
            return {'success': False, 'message': f'No beds available in {ward_name}'}
        
        # 2. Find first available bed
        cursor.execute("""
            SELECT bed_id, bed_number 
            FROM beds 
            WHERE ward_id = %s AND is_occupied = 0 
            LIMIT 1
        """, (ward_id,))
        
        bed_data = cursor.fetchone()
        
        if not bed_data:
            return {'success': False, 'message': 'No available beds found'}
        
        bed_id = bed_data['bed_id']
        bed_number = bed_data['bed_number']
        
        # 3. Calculate queue position and wait time
        cursor.execute("""
            SELECT COUNT(*) as count 
            FROM patient_assignments 
            WHERE ward_id = %s 
            AND status = 'waiting' 
            AND priority_score >= %s
        """, (ward_id, priority_score))
        
        queue_data = cursor.fetchone()
        queue_position = queue_data['count'] + 1
        
        # Average service times (minutes) per ward
        service_times = {
            'ICU': 120,
            'Cardiac Ward': 45,
            'Cardiology Ward': 40,
            'Endocrinology Ward': 30,
            'Emergency Ward': 25,
            'General Ward': 20
        }
        
        avg_service_time = service_times.get(ward_name, 30)
        priority_factor = (11 - priority_score) / 10
        estimated_wait = int((queue_position - 1) * avg_service_time * priority_factor)
        
        # 4. Insert into patient_assignments
        cursor.execute("""
            INSERT INTO patient_assignments 
            (patient_id, ward_id, bed_id, predicted_ward, ml_confidence, 
             priority_score, queue_position, estimated_wait_time, 
             queue_entry_time, status)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (
            patient_id, 
            ward_id, 
            bed_id, 
            ward_name, 
            float(ml_confidence),
            float(priority_score),
            queue_position,
            estimated_wait,
            datetime.now(),
            'waiting'
        ))
        
        # 5. Mark bed as occupied
        cursor.execute("""
            UPDATE beds 
            SET is_occupied = 1 
            WHERE bed_id = %s
        """, (bed_id,))
        
        # 6. Update ward availability
        cursor.execute("""
            UPDATE wards 
            SET available_beds = available_beds - 1 
            WHERE ward_id = %s
        """, (ward_id,))
        
        conn.commit()
        
        return {
            'success': True,
            'ward': ward_name,
            'bed_number': bed_number,
            'ward_id': ward_id,
            'confidence': round(ml_confidence * 100, 2),
            'priority_score': priority_score,
            'queue_position': queue_position,
            'estimated_wait': estimated_wait
        }
        
    except Exception as e:
        conn.rollback()
        print(f"Error in assign_to_queue: {str(e)}")
        return {'success': False, 'message': str(e)}
        
    finally:
        cursor.close()
        conn.close()


def calculate_queue_metrics(ward_name=None):
    """
    Calculate queue analytics for charts.
    Used by /api/queue-analytics endpoint.
    """
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    try:
        ward_filter = ""
        params = []
        
        if ward_name and ward_name != 'all':
            ward_filter = "WHERE predicted_ward = %s"
            params.append(ward_name)
        
        # Priority distribution
        cursor.execute(f"""
            SELECT 
                priority_score,
                COUNT(*) as count
            FROM patient_assignments
            {ward_filter}
            GROUP BY priority_score
            ORDER BY priority_score
        """, params)
        
        priority_dist = cursor.fetchall()
        
        # Average wait time
        cursor.execute(f"""
            SELECT AVG(estimated_wait_time) as avg_wait
            FROM patient_assignments
            {ward_filter}
        """, params)
        
        avg_wait_result = cursor.fetchone()
        avg_wait = round(avg_wait_result['avg_wait'] or 0, 1)
        
        return {
            'priority_distribution': priority_dist,
            'avg_wait': avg_wait,
            'success': True
        }
        
    except Exception as e:
        print(f"Error calculating metrics: {str(e)}")
        return {'success': False, 'message': str(e)}
        
    finally:
        cursor.close()
        conn.close()
