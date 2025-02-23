#!/bin/bash

# Ensure script is run with bash
set -e

# Navigate to the script's directory
cd "$(dirname "$0")"

# Create virtual environment if not exists
if [ ! -d "venv" ]; then
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Upgrade pip
pip install --upgrade pip

# Java Installation and Configuration
echo "Configuring Java for LanguageTool..."

# Install OpenJDK if not already installed
if ! command -v java &> /dev/null; then
    echo "Installing OpenJDK..."
    brew install openjdk
fi

# Ensure Java is in PATH and JAVA_HOME is set
export JAVA_HOME=$(brew --prefix openjdk)
export PATH="$JAVA_HOME/bin:$PATH"

# Verify Java installation
java -version

# Symlink Java for system-wide access
sudo ln -sfn "$(brew --prefix openjdk)/libexec/openjdk.jdk" "/Library/Java/JavaVirtualMachines/openjdk.jdk"

# Install system dependencies
brew install tesseract || true
brew install tesseract-lang || true

# Install Python dependencies
pip install pytesseract
pip install Pillow
pip install language-tool-python
pip install pyspellchecker
pip install SpeechRecognition

# Optional: Install additional NLP libraries
pip install transformers
pip install torch

# Verify Tesseract installation
echo "Tesseract Version:"
tesseract --version

# Verify Python dependencies
python3 -c "import pytesseract; print('Pytesseract Version:', pytesseract.__version__)"

# Deactivate virtual environment
deactivate

echo "Python environment setup complete!"