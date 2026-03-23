"""
GuardRAG - Privacy-first, fully offline AI document assistant
Setup configuration for pip installation
"""

from setuptools import setup, find_packages
from pathlib import Path

# Read the README for the long description
here = Path(__file__).parent.resolve()
long_description = (here / "README.md").read_text(encoding="utf-8")

# Read requirements
requirements = (here / "requirements.txt").read_text(encoding="utf-8").strip().split("\n")
requirements = [r.strip() for r in requirements if r.strip() and not r.startswith("#")]

setup(
    name="guard-rag",
    version="1.0.0",
    description="Privacy-first, fully offline AI document assistant secured by tiered safety guardrails",
    long_description=long_description,
    long_description_content_type="text/markdown",
    author="Sowmiyan S",
    author_email="",
    license="MIT",
    url="https://github.com/sowmiyan-s/GUADRAILS-RAG-CHAT-TOOL",
    project_urls={
        "Documentation": "https://github.com/sowmiyan-s/GUADRAILS-RAG-CHAT-TOOL#readme",
        "Source Code": "https://github.com/sowmiyan-s/GUADRAILS-RAG-CHAT-TOOL",
        "Bug Tracker": "https://github.com/sowmiyan-s/GUADRAILS-RAG-CHAT-TOOL/issues",
    },
    
    packages=find_packages(include=["guardrag", "guardrag.*"]),
    
    python_requires=">=3.9",
    
    install_requires=requirements,
    
    entry_points={
        "console_scripts": [
            "guard-rag=guardrag.cli.main:main",
        ],
    },
    
    classifiers=[
        "Development Status :: 4 - Beta",
        "Intended Audience :: Developers",
        "License :: OSI Approved :: MIT License",
        "Operating System :: OS Independent",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.9",
        "Programming Language :: Python :: 3.10",
        "Programming Language :: Python :: 3.11",
        "Programming Language :: Python :: 3.12",
        "Topic :: Scientific/Engineering :: Artificial Intelligence",
    ],
    
    keywords=[
        "rag", "retrieval-augmented-generation", "langchain", "ollama",
        "faiss", "embeddings", "chatbot", "llm", "privacy", "offline",
    ],
)
