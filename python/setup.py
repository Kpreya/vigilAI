from setuptools import setup, find_packages
import os

# Read README if it exists
readme_path = os.path.join(os.path.dirname(__file__), "README.md")
if os.path.exists(readme_path):
    with open(readme_path, "r", encoding="utf-8") as fh:
        long_description = fh.read()
else:
    long_description = "VigilAI SDK - Automated incident detection, AI-powered diagnosis, and automatic code fix generation"

setup(
    name="vigilai-sdk",
    version="0.1.0",
    author="VigilAI",
    author_email="support@vigilai.dev",
    description="VigilAI SDK - Automated incident detection, AI-powered diagnosis, and automatic code fix generation",
    long_description=long_description,
    long_description_content_type="text/markdown",
    url="https://github.com/vigilai/sdk",
    project_urls={
        "Bug Tracker": "https://github.com/vigilai/sdk/issues",
        "Documentation": "https://github.com/vigilai/sdk#readme",
        "Source Code": "https://github.com/vigilai/sdk",
    },
    packages=find_packages(where="src"),
    package_dir={"": "src"},
    classifiers=[
        "Development Status :: 3 - Alpha",
        "Intended Audience :: Developers",
        "License :: OSI Approved :: MIT License",
        "Operating System :: OS Independent",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.8",
        "Programming Language :: Python :: 3.9",
        "Programming Language :: Python :: 3.10",
        "Programming Language :: Python :: 3.11",
        "Programming Language :: Python :: 3.12",
        "Topic :: Software Development :: Libraries :: Python Modules",
        "Topic :: System :: Monitoring",
        "Topic :: Software Development :: Quality Assurance",
    ],
    keywords="monitoring observability ai diagnostics incident-detection error-tracking performance-monitoring anomaly-detection automated-fixes",
    python_requires=">=3.8",
    install_requires=[
        "requests>=2.31.0",
        "pyyaml>=6.0",
        "psutil>=5.9.0",
        "PyGithub>=2.1.0",
    ],
    extras_require={
        "dev": [
            "pytest>=7.4.0",
            "pytest-asyncio>=0.21.0",
            "hypothesis>=6.92.0",
            "black>=23.0.0",
            "mypy>=1.0.0",
            "pylint>=2.17.0",
        ],
    },
)
