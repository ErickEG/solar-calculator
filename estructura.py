#!/usr/bin/env python3
"""
Exporta la estructura y contenido de un proyecto a un único archivo markdown,
limitando el contenido a un conjunto específico de archivos.

Uso:
    python estructura.py RUTA_DEL_PROYECTO [--output salida.md] [--max-size-kb 200]
"""

import os
import argparse
from pathlib import Path

# Carpetas a ignorar por defecto
DEFAULT_IGNORED_DIRS = {".git", "__pycache__", "node_modules", ".idea", ".vscode", ".venv", "venv"}

# Lista de archivos a incluir (rutas relativas respecto a la raíz del proyecto)
SELECTED_FILES = [
    # Frontend Calculadora (src/)
    "src/components/SystemCalculator.tsx",
    "src/components/LoadTable.tsx",
    "src/components/ConsumptionProfile.tsx",       # NUEVO
    "src/components/SystemRecommendation.tsx",     # NUEVO
    "src/services/api.ts",
    "src/types/index.ts",
    "src/App.tsx",

    # Datos frontend
    "src/data/equipment-db.ts",                    # NUEVO

    # Configuración (frontend principal)
    "package.json",
    ".env",

    # Backend API (backend/)
    "backend/src/server.ts",
    "backend/src/routes/panels.ts",
    "backend/src/routes/inverters.ts",
    "backend/src/routes/analysis.ts",             # NUEVO
    "backend/src/types/index.ts",
    "backend/src/database/database.ts",           # NUEVO
    "backend/package.json",

    # Panel Admin (admin-panel/)
    "admin-panel/src/components/PanelsManager.tsx",
    "admin-panel/src/components/InvertersManager.tsx",
    "admin-panel/src/types/api.ts",
    "admin-panel/src/services/api.ts",            # NUEVO
]


def build_tree(root: Path) -> str:
    """
    Construye un árbol de directorios estilo 'tree'.
    """
    lines = [f"Proyecto: {root.resolve()}", ""]

    def walk(dir_path: Path, prefix: str = ""):
        # Listar contenido y separar en carpetas y archivos
        try:
            entries = sorted(dir_path.iterdir(), key=lambda p: (p.is_file(), p.name.lower()))
        except PermissionError:
            return

        dirs = [e for e in entries if e.is_dir() and e.name not in DEFAULT_IGNORED_DIRS]
        files = [e for e in entries if e.is_file()]

        total = len(dirs) + len(files)

        for idx, entry in enumerate(dirs + files):
            connector = "└── " if idx == total - 1 else "├── "
            line = prefix + connector + entry.name
            lines.append(line)

            if entry.is_dir():
                extension_prefix = "    " if idx == total - 1 else "│   "
                walk(entry, prefix + extension_prefix)

    walk(root)
    return "\n".join(lines)


def is_probably_text(path: Path, blocksize: int = 256) -> bool:
    """
    Heurística sencilla para distinguir texto de binario.
    """
    try:
        with path.open("rb") as f:
            chunk = f.read(blocksize)
    except Exception:
        return False

    if b"\0" in chunk:
        return False

    # Intentar decodificar como utf-8
    try:
        chunk.decode("utf-8")
        return True
    except UnicodeDecodeError:
        return False


def export_single_file(
    root: Path,
    file_rel_path: str,
    lines: list[str],
    max_size_kb: int,
    output: Path,
) -> None:
    """
    Exporta un único archivo (si existe) al markdown.
    """
    max_bytes = max_size_kb * 1024
    rel_path_str = file_rel_path
    file_path = root / rel_path_str

    # Normalizar el path relativo para mostrar
    rel_path_display = Path(rel_path_str)

    if not file_path.exists():
        lines.append(f"### `{rel_path_display}`")
        lines.append("")
        lines.append("> Archivo indicado pero no encontrado en el proyecto.")
        lines.append("")
        return

    # Saltar el propio archivo de salida si está dentro del proyecto
    if file_path.resolve() == output.resolve():
        return

    # Comprobar tamaño
    try:
        size = file_path.stat().st_size
    except OSError:
        lines.append(f"### `{rel_path_display}`")
        lines.append("")
        lines.append("> No se pudo leer el tamaño del archivo.")
        lines.append("")
        return

    if size > max_bytes:
        lines.append(f"### `{rel_path_display}`")
        lines.append("")
        lines.append(
            f"> Archivo omitido (tamaño {size/1024:.1f} KB superior a {max_size_kb} KB)."
        )
        lines.append("")
        return

    # Detectar binarios
    if not is_probably_text(file_path):
        lines.append(f"### `{rel_path_display}`")
        lines.append("")
        lines.append("> Archivo omitido (probablemente binario).")
        lines.append("")
        return

    # Leer contenido
    try:
        content = file_path.read_text(encoding="utf-8")
    except UnicodeDecodeError:
        # Intentar latin-1 como fallback
        try:
            content = file_path.read_text(encoding="latin-1")
        except Exception:
            lines.append(f"### `{rel_path_display}`")
            lines.append("")
            lines.append("> No se pudo leer el archivo (problema de codificación).")
            lines.append("")
            return
    except Exception:
        lines.append(f"### `{rel_path_display}`")
        lines.append("")
        lines.append("> No se pudo leer el archivo (error desconocido).")
        lines.append("")
        return

    # Detectar lenguaje para el bloque de código por extensión (sencillo)
    ext = file_path.suffix.lower()
    lang_map = {
        ".py": "python",
        ".js": "javascript",
        ".ts": "typescript",
        ".tsx": "tsx",
        ".html": "html",
        ".css": "css",
        ".json": "json",
        ".yml": "yaml",
        ".yaml": "yaml",
        ".md": "markdown",
        ".c": "c",
        ".cpp": "cpp",
        ".h": "c",
        ".hpp": "cpp",
        ".txt": "",
        ".env": "",
    }
    lang = lang_map.get(ext, "")

    lines.append(f"### `{rel_path_display}`")
    lines.append("")
    lines.append(f"```{lang}".rstrip())  # evita "``` " con espacio
    lines.append(content)
    lines.append("```")
    lines.append("")


def export_project(
    root: Path,
    output: Path,
    max_size_kb: int = 200,
) -> None:
    """
    Exporta estructura + contenido de archivos seleccionados a un markdown.
    """
    root = root.resolve()
    output = output.resolve()

    tree_str = build_tree(root)

    lines: list[str] = []
    lines.append("# Exportación de proyecto")
    lines.append("")
    lines.append(f"Ruta del proyecto: `{root}`")
    lines.append("")
    lines.append("## Árbol de directorios")
    lines.append("")
    lines.append("```text")
    lines.append(tree_str)
    lines.append("```")
    lines.append("")
    lines.append("## Contenido de archivos seleccionados")
    lines.append("")

    for rel_path in SELECTED_FILES:
        export_single_file(root, rel_path, lines, max_size_kb=max_size_kb, output=output)

    output.write_text("\n".join(lines), encoding="utf-8")
    print(f"Exportación completada en: {output}")


def main():
    parser = argparse.ArgumentParser(
        description="Extrae la estructura y contenido (solo archivos seleccionados) de un proyecto a un archivo markdown."
    )
    parser.add_argument(
        "project_path",
        type=str,
        help="Ruta a la carpeta del proyecto",
    )
    parser.add_argument(
        "--output",
        "-o",
        type=str,
        default="project_export.md",
        help="Ruta del archivo de salida (por defecto: project_export.md)",
    )
    parser.add_argument(
        "--max-size-kb",
        type=int,
        default=200,
        help="Tamaño máximo por archivo en KB (por defecto: 200 KB). Archivos mayores se omiten.",
    )

    args = parser.parse_args()

    root = Path(args.project_path)
    if not root.exists() or not root.is_dir():
        raise SystemExit(f"La ruta {root} no existe o no es una carpeta válida.")

    output = Path(args.output)

    export_project(root, output, max_size_kb=args.max_size_kb)


if __name__ == "__main__":
    main()
