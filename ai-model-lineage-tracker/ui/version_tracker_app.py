import tkinter as tk
from tkinter import ttk, messagebox
import os
import json

from ai_model.train_model import train_new_version

# ---------------- CONFIG ----------------
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODEL_VERSIONS_DIR = os.path.join(BASE_DIR, "ai_model", "model_versions")

# ---------------- MAIN WINDOW ----------------
root = tk.Tk()
root.title("Blockchain-based AI Model Lineage Tracker")
root.state("zoomed")

# ---------------- SCROLLABLE FRAME ----------------
canvas = tk.Canvas(root)
scrollbar = ttk.Scrollbar(root, orient="vertical", command=canvas.yview)

scrollable_frame = tk.Frame(canvas)

scrollable_frame.bind(
    "<Configure>",
    lambda e: canvas.configure(scrollregion=canvas.bbox("all"))
)

canvas.create_window((0, 0), window=scrollable_frame, anchor="nw")
canvas.configure(yscrollcommand=scrollbar.set)

canvas.pack(side="left", fill="both", expand=True)
scrollbar.pack(side="right", fill="y")

# ---------------- TITLE ----------------
title = tk.Label(
    scrollable_frame,
    text="AI Model Lineage & Blockchain Integrity Tracker",
    font=("Arial", 22, "bold"),
    fg="#0d47a1"
)
title.pack(pady=20)

# ---------------- SYSTEM STATUS ----------------
status_frame = tk.Frame(scrollable_frame, bg="#1e1e1e")
status_frame.pack(fill="x", padx=20, pady=5)

status_label = tk.Label(
    status_frame,
    text="AI Model Training: Ready    |    Blockchain: Remix VM",
    fg="white",
    bg="#1e1e1e",
    font=("Arial", 11)
)

status_label.pack(pady=6)

# ---------------- VERSION COUNT ----------------
version_count_label = tk.Label(
    scrollable_frame,
    text="Total Model Versions: 0",
    font=("Arial", 12, "bold"),
    fg="#333"
)

version_count_label.pack(pady=5)

# =====================================================
# SECTION 1 — TRAIN MODEL
# =====================================================

train_frame = tk.LabelFrame(scrollable_frame, text="Phase 2: Train New Model Version", padx=10, pady=10)
train_frame.pack(fill="x", padx=20, pady=10)


def train_model():
    metadata = train_new_version()

    messagebox.showinfo(
        "Training Complete",
        f"Model Version {metadata['version_id']} created successfully."
    )

    load_versions()
    show_lineage()

    version_var.set(metadata["version_id"])
    show_metadata()


train_button = tk.Button(
    train_frame,
    text="Train New Version",
    font=("Arial", 12),
    bg="#4CAF50",
    fg="white",
    command=train_model
)

train_button.pack(pady=5)

# =====================================================
# SECTION 2 — VERSION EXPLORER
# =====================================================

version_frame = tk.LabelFrame(scrollable_frame, text="Phase 2 & 3: Version Explorer", padx=10, pady=10)
version_frame.pack(fill="x", padx=20, pady=10)

version_var = tk.StringVar()

version_dropdown = ttk.Combobox(
    version_frame,
    textvariable=version_var,
    state="readonly",
    width=25
)

version_dropdown.pack(pady=5)

metadata_display = tk.Text(
    scrollable_frame,
    height=12,
    width=120,
    bg="#111",
    fg="#00ff9c",
    font=("Consolas", 10)
)

metadata_display.pack(padx=20, pady=10)


def load_versions():

    versions = sorted(
        [v for v in os.listdir(MODEL_VERSIONS_DIR) if v.startswith("v")],
        key=lambda x: int(x.replace("v", ""))
    )

    version_dropdown["values"] = versions

    version_count_label.config(
        text=f"Total Model Versions: {len(versions)}"
    )

    if versions:
        latest = versions[-1]
        version_var.set(latest)
        show_metadata()


def show_metadata(event=None):

    selected_version = version_var.get()

    if not selected_version:
        return

    metadata_path = os.path.join(
        MODEL_VERSIONS_DIR,
        selected_version,
        "metadata.json"
    )

    if os.path.exists(metadata_path):

        with open(metadata_path, "r") as f:
            metadata = json.load(f)

        metadata_display.delete("1.0", tk.END)
        metadata_display.insert(tk.END, json.dumps(metadata, indent=4))


version_dropdown.bind("<<ComboboxSelected>>", show_metadata)

# =====================================================
# SECTION 3 — VERSION LINEAGE
# =====================================================

lineage_frame = tk.LabelFrame(scrollable_frame, text="Version Lineage", padx=10, pady=10)
lineage_frame.pack(fill="x", padx=20, pady=10)

lineage_label = tk.Label(lineage_frame, text="", font=("Arial", 13))
lineage_label.pack()


def show_lineage():

    versions = sorted(
        [v for v in os.listdir(MODEL_VERSIONS_DIR) if v.startswith("v")],
        key=lambda x: int(x.replace("v", ""))
    )

    lineage_text = "  →  ".join(versions)

    lineage_label.config(text=lineage_text)

# =====================================================
# SECTION 4 — BLOCKCHAIN REGISTRATION
# =====================================================

blockchain_frame = tk.LabelFrame(scrollable_frame, text="Phase 4: Register Model Version on Blockchain", padx=10, pady=10)
blockchain_frame.pack(fill="x", padx=20, pady=10)

blockchain_info = tk.Label(
    blockchain_frame,
    text="Select a version and click the button below to prepare blockchain registration data.",
    font=("Arial", 11)
)

blockchain_info.pack(pady=5)


def prepare_blockchain_data():

    selected_version = version_var.get()

    if not selected_version:
        messagebox.showerror("Error", "Please select a model version first.")
        return

    metadata_path = os.path.join(
        MODEL_VERSIONS_DIR,
        selected_version,
        "metadata.json"
    )

    if not os.path.exists(metadata_path):
        messagebox.showerror("Error", "Metadata not found.")
        return

    with open(metadata_path, "r") as f:
        metadata = json.load(f)

    model_id = metadata["model_id"]
    version_id = metadata["version_id"]
    dataset_hash = metadata["dataset_hash"]

    blockchain_text.delete("1.0", tk.END)

    blockchain_text.insert(
        tk.END,
        "STEP 1 — Open Remix IDE\n"
        "STEP 2 — Call function: registerModelVersion\n\n"
    )

    blockchain_text.insert(tk.END, "Paste the following values:\n\n")

    blockchain_text.insert(tk.END, f"modelId:\n{model_id}\n\n")
    blockchain_text.insert(tk.END, f"versionId:\n{version_id}\n\n")
    blockchain_text.insert(tk.END, f"datasetHash:\n{dataset_hash}\n\n")

    blockchain_text.insert(
        tk.END,
        "STEP 3 — Click TRANSACT in Remix\n"
        "STEP 4 — Verify using getModelVersion\n"
    )


prepare_button = tk.Button(
    blockchain_frame,
    text="Prepare Blockchain Data",
    font=("Arial", 11),
    bg="#2196F3",
    fg="white",
    command=prepare_blockchain_data
)

prepare_button.pack(pady=5)

blockchain_text = tk.Text(
    scrollable_frame,
    height=10,
    width=120
)

blockchain_text.pack(padx=20, pady=10)

# ---------------- INITIAL LOAD ----------------
load_versions()
show_lineage()

# ---------------- RUN ----------------
root.mainloop()