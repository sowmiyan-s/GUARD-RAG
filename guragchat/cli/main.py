"""
GuragChat CLI - Command-line interface for the RAG chatbot.

Usage:
    guragchat --pdf path/to/document.pdf
    guragchat --pdf document.pdf --model llama2
"""

import os
import sys
import argparse
from pathlib import Path

# Fix OMP error for FAISS
os.environ["KMP_DUPLICATE_LIB_OK"] = "TRUE"

from langchain_core.messages import HumanMessage, AIMessage
from dotenv import load_dotenv

from guragchat.rag.core import build_rag_chain
from guragchat.utils.ollama import is_ollama_running, start_ollama_server
from guragchat.utils.safety import check_input_safety, check_output_safety

# Load environment variables
load_dotenv()


def main():
    """Main CLI entry point."""
    parser = argparse.ArgumentParser(
        prog="guragchat",
        description="GuragChat - Privacy-first, offline AI document assistant",
        epilog="GitHub: https://github.com/sowmiyan-s | License: MIT"
    )
    parser.add_argument(
        "--pdf",
        type=str,
        required=True,
        help="Path to the PDF file to query"
    )
    parser.add_argument(
        "--model",
        type=str,
        default="gemma3:1b",
        help="Ollama model name (default: gemma3:1b)"
    )
    parser.add_argument(
        "--ollama-host",
        type=str,
        default="http://localhost:11434",
        help="Ollama server URL (default: http://localhost:11434)"
    )
    parser.add_argument(
        "--chunk-size",
        type=int,
        default=1000,
        help="Document chunk size (default: 1000)"
    )
    parser.add_argument(
        "--chunk-overlap",
        type=int,
        default=200,
        help="Chunk overlap (default: 200)"
    )
    parser.add_argument(
        "--no-guardrails",
        action="store_true",
        help="Disable safety guardrails"
    )
    parser.add_argument(
        "--sensitivity",
        type=str,
        default="Internal",
        choices=["Public", "Internal", "Confidential", "Restricted"],
        help="Data sensitivity level (default: Internal)"
    )
    
    args = parser.parse_args()
    
    # Validate PDF path
    pdf_path = Path(args.pdf)
    if not pdf_path.exists():
        print(f"Error: The file '{args.pdf}' does not exist.")
        sys.exit(1)
    
    # Check Ollama
    ollama_host = args.ollama_host.rstrip("/")
    print(f"Checking Ollama at {ollama_host}...")
    
    if not is_ollama_running(ollama_host):
        print("Ollama is not running. Attempting to start...")
        if start_ollama_server():
            print("✓ Ollama started successfully")
        else:
            print(f"✗ Failed to start Ollama. Ensure it's installed and configured.")
            print(f"  Download from: https://ollama.ai")
            sys.exit(1)
    else:
        print("✓ Ollama is running")
    
    # Build RAG pipeline
    print(f"\nBuilding RAG pipeline with {args.model}...")
    try:
        db_id, rag_chain = build_rag_chain(
            [str(pdf_path)],
            model=args.model,
            chunk_size=args.chunk_size,
            chunk_overlap=args.chunk_overlap,
            ollama_host=ollama_host
        )
    except Exception as e:
        print(f"✗ Error building RAG pipeline: {e}")
        sys.exit(1)
    
    # Start chat loop
    print("\n" + "="*70)
    print(" GuragChat - Privacy-first, Offline AI Document Assistant")
    print(" Powered by LangChain + Ollama + HuggingFace Embeddings (100% Offline)")
    print("="*70)
    print(f"\nDocument: {pdf_path.name}")
    print(f"Model: {args.model}")
    print(f"Sensitivity: {args.sensitivity}")
    if args.no_guardrails:
        print("⚠️  Guardrails DISABLED")
    print("\nType 'exit', 'quit', or press Ctrl+C to stop.\n")
    
    messages = []
    enable_guardrails = not args.no_guardrails
    
    while True:
        try:
            question = input("You: ").strip()
            
            if not question:
                continue
            
            if question.lower() in ["exit", "quit"]:
                print("\nGoodbye!")
                break
            
            # Safety check: input
            if enable_guardrails:
                blocked = check_input_safety(
                    question,
                    args.sensitivity,
                    enabled=True
                )
                if blocked:
                    print(f"\nChatbot: {blocked}\n")
                    continue
            
            # Build message history
            chat_history = []
            for msg in messages:
                if msg["role"] == "user":
                    chat_history.append(HumanMessage(content=msg["content"]))
                else:
                    chat_history.append(AIMessage(content=msg["content"]))
            
            # Get response
            try:
                result = rag_chain.invoke({
                    "input": question,
                    "chat_history": chat_history
                })
                
                if isinstance(result, dict) and "answer" in result:
                    answer = result["answer"]
                else:
                    answer = str(result)
                
                # Safety check: output
                if enable_guardrails:
                    blocked_out = check_output_safety(
                        answer,
                        args.sensitivity,
                        enabled=True
                    )
                    if blocked_out:
                        answer = blocked_out
                
                print(f"\nChatbot: {answer}\n")
                
                # Store in history
                messages.append({"role": "user", "content": question})
                messages.append({"role": "assistant", "content": answer})
                
            except Exception as e:
                print(f"\n✗ Error generating response: {e}\n")
        
        except KeyboardInterrupt:
            print("\n\nGoodbye!")
            break


if __name__ == "__main__":
    main()
