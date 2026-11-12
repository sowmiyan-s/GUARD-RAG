import sys
from pathlib import Path

# Ensure guardrag package is on sys.path for direct pytest invocation
ROOT_DIR = Path(__file__).resolve().parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

