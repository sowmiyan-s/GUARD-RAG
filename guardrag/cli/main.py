"""
GuardRAG CLI - Command-line interface for the RAG chatbot.

Usage:
    guard-rag --pdf path/to/document.pdf
    guard-rag --pdf document.pdf --model llama2
"""

import os
import sys
import argparse
from pathlib import Path

# Add rich for console GUI
from rich.console import Console
from rich.panel import Panel
from rich.text import Text
from rich.prompt import Prompt
from rich.markdown import Markdown
from rich.theme import Theme

custom_theme = Theme({
    "info": "dim cyan",
    "warning": "magenta",
    "danger": "bold red"
})
console = Console(theme=custom_theme)

# Fix OMP error for FAISS
os.environ["KMP_DUPLICATE_LIB_OK"] = "TRUE"

from dotenv import load_dotenv

from guardrag.rag.core import build_rag_chain
from guardrag.utils.ollama import is_ollama_running, start_ollama_server
from guardrag.utils.safety import check_input_safety, check_output_safety

# Load environment variables
load_dotenv()

def run_web_ui():
    """Launch the internal FastAPI web application."""
    import uvicorn
    import threading
    import time
    import webbrowser

    print("\n🚀 Starting GuardRAG Local Web Interface on port 8000...\n")
    
    def open_browser():
        time.sleep(1.5)
        webbrowser.open("http://127.0.0.1:8000")
        
    threading.Thread(target=open_browser, daemon=True).start()
    uvicorn.run("guardrag.api.main:app", host="127.0.0.1", port=8000, log_level="warning")
    sys.exit(0)



def main():
    """Main CLI entry point."""
    if len(sys.argv) == 1:
        run_web_ui()
        
    parser = argparse.ArgumentParser(
        prog="guardrag",
        description="GuardRAG - Privacy-first, offline AI document assistant",
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
    console.print(f"[info]Checking Ollama at[/info] [bold white]{ollama_host}[/bold white]...")
    
    if not is_ollama_running(ollama_host):
        console.print("[yellow]Ollama is not running. Attempting to start...[/yellow]")
        if start_ollama_server():
            console.print("[bold green]✓ Ollama started successfully[/bold green]")
        else:
            console.print(Panel(
                "[bold red]✗ Failed to start Ollama.[/bold red]\nEnsure it's installed and configured.\nDownload from: [blue]https://ollama.ai[/blue]",
                title="Error", border_style="red"
            ))
            sys.exit(1)
    else:
        console.print("[bold green]✓ Ollama is running[/bold green]")
    
    # Build RAG pipeline
    console.print(f"\n[cyan]Building RAG pipeline with[/cyan] [bold white]{args.model}[/bold white]...")
    try:
        db_id, rag_chain = build_rag_chain(
            [str(pdf_path)],
            model=args.model,
            chunk_size=args.chunk_size,
            chunk_overlap=args.chunk_overlap,
            ollama_host=ollama_host
        )
    except Exception as e:
        console.print(f"[bold red]✗ Error building RAG pipeline: {e}[/bold red]")
        sys.exit(1)
    
    # Start chat loop
    welcome_text = (
        f"📄 [bold]Document:[/bold] {pdf_path.name}\n"
        f"🤖 [bold]Model:[/bold] {args.model}\n"
        f"🔒 [bold]Sensitivity:[/bold] {args.sensitivity}\n\n"
        f"[dim]Type 'exit', 'quit', or press Ctrl+C to stop.[/dim]"
    )
    
    if args.no_guardrails:
        welcome_text = "[bold yellow]⚠️  Guardrails DISABLED[/bold yellow]\n\n" + welcome_text
        
    console.print()
    console.print(Panel(
        welcome_text,
        title="[bold green]GuardRAG[/bold green] - Privacy-first AI",
        subtitle="[bold]Developer:[/bold] Sowmiyan S | [blue]github.com/sowmiyan-s[/blue]",
        border_style="green",
        expand=False
    ))
    console.print()
    
    messages = []
    enable_guardrails = not args.no_guardrails
    
    while True:
        try:
            question = Prompt.ask("[bold cyan]You[/bold cyan]").strip()
            
            if not question:
                continue
            
            if question.lower() in ["exit", "quit"]:
                console.print("\n[dim]Goodbye![/dim]")
                break
            
            # Safety check: input
            if enable_guardrails:
                blocked = check_input_safety(
                    question,
                    args.sensitivity,
                    enabled=True
                )
                if blocked:
                    console.print(Panel(f"[bold red]{blocked}[/bold red]", title="🛡️ GuardRAG Block", border_style="red"))
                    continue
            
            # Build message history
            from langchain_core.messages import HumanMessage, AIMessage
            chat_history = []
            for msg in messages:
                if msg["role"] == "user":
                    chat_history.append(HumanMessage(content=msg["content"]))
                else:
                    chat_history.append(AIMessage(content=msg["content"]))
            
            # Get response
            try:
                import time
                with console.status("[bold green]Thinking...[/bold green]"):
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
                        answer = f"[bold red]{blocked_out}[/bold red]"
                
                console.print()
                console.print(Panel(Markdown(answer), title="[bold green]Assistant[/bold green]", border_style="green", title_align="left"))
                console.print()
                
                # Store in history
                messages.append({"role": "user", "content": question})
                messages.append({"role": "assistant", "content": answer})
                
            except Exception as e:
                console.print(f"\n[bold red]✗ Error generating response: {e}[/bold red]\n")
        
        except KeyboardInterrupt:
            console.print("\n\n[dim]Goodbye![/dim]")
            break


if __name__ == "__main__":
    main()
