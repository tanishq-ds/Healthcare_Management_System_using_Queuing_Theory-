from setuptools import setup, find_packages

with open("README.md", "r", encoding="utf-8") as fh:
    long_description = fh.read()

with open("requirements.txt", "r", encoding="utf-8") as fh:
    requirements = [line.strip() for line in fh if line.strip() and not line.startswith("#")]

setup(
    name="hospital-management-system",
    version="1.0.0",
    author="Tanishq Verma",
    description="ML-driven hospital management system with queuing theory",
    long_description=long_description,
    long_description_content_type="text/markdown",
    url="https://github.com/tanishq-ds/Healthcare_Management_System_using_Queuing_Theory-",
    packages=find_packages(),
    classifiers=[
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.8",
        "Programming Language :: Python :: 3.9",
        "Programming Language :: Python :: 3.10",
        "License :: OSI Approved :: MIT License",
        "Operating System :: OS Independent",
        "Topic :: Scientific/Engineering :: Artificial Intelligence",
        "Topic :: Database",
    ],
    python_requires=">=3.8",
    install_requires=requirements,
)

# Install with :- pip install -e .
