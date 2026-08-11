import tkinter as tk
from tkinter import ttk, messagebox
import os
import json

from ai_model.train_model import train_new_version

# ---------------- CONFIG ----------------
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODEL_VERSIONS_DIR = os.path.join(BASE_DIR, "ai_model", "model_versions")

selected_model = "LR_MODEL_001"

# ---------------- MAIN WINDOW ----------------
root = tk.Tk()
root.title("AI Model Lineage & Blockchain Tracker")
root.state("zoomed")

# ---------------- LAYOUT ----------------
main_frame = tk.Frame(root)
main_frame.pack(fill="both", expand=True)

sidebar = tk.Frame(main_frame, bg="#1e1e1e", width=250)
sidebar.pack(side="left", fill="y")

content = tk.Frame(main_frame)
content.pack(side="right", fill="both", expand=True)

pages = {}

# =====================================================
# PAGE SWITCH
# =====================================================

def show_page(name):
    for page in pages.values():
        page.pack_forget()
    pages[name].pack(fill="both", expand=True)

# =====================================================
# PAGE 1 — MODEL SELECTION
# =====================================================

page_model = tk.Frame(content)
pages["model"] = page_model

tk.Label(page_model, text="Select AI Model for Version Tracking", font=("Arial",22,"bold")).pack(pady=40)

model_var = tk.StringVar()

model_dropdown = ttk.Combobox(page_model, textvariable=model_var, state="readonly", width=40)
model_dropdown["values"] = ["LR_MODEL_001 (Logistic Regression)"]
model_dropdown.pack(pady=20)

def start_tracking():
    global selected_model

    if not model_var.get():
        messagebox.showerror("Error","Select a model first")
        return

    selected_model = model_var.get().split()[0]
    messagebox.showinfo("Model Selected", f"Tracking enabled for {selected_model}")

tk.Button(page_model, text="Start Tracking", font=("Arial",12), bg="#4CAF50", fg="white", command=start_tracking).pack(pady=10)

# =====================================================
# PAGE 2 — TRAIN MODEL (UPDATED)
# =====================================================

page_train = tk.Frame(content)
pages["train"] = page_train

tk.Label(page_train, text="Train New Model Version", font=("Arial",20,"bold")).pack(pady=20)

# 🔥 INPUT FIELDS

tk.Label(page_train, text="Experiment Note").pack()
note_input = tk.Entry(page_train, width=60)
note_input.pack(pady=5)

tk.Label(page_train, text="Code Change Summary").pack()
summary_input = tk.Entry(page_train, width=60)
summary_input.pack(pady=5)

tk.Label(page_train, text="Code Snippet (optional)").pack()
snippet_input = tk.Entry(page_train, width=60)
snippet_input.pack(pady=5)


def train_model():

    metadata = train_new_version(
        experiment_note=note_input.get(),
        code_change_summary=summary_input.get(),
        code_snippet=snippet_input.get()
    )

    messagebox.showinfo("Training Complete", f"Version {metadata['version_id']} created.")

    # clear inputs
    note_input.delete(0, tk.END)
    summary_input.delete(0, tk.END)
    snippet_input.delete(0, tk.END)

    load_versions()
    load_dashboard()
    draw_lineage()


tk.Button(
    page_train,
    text="Train New Version",
    font=("Arial",12),
    bg="#4CAF50",
    fg="white",
    command=train_model
).pack(pady=15)

# =====================================================
# PAGE 3 — VERSION EXPLORER
# =====================================================

page_versions = tk.Frame(content)
pages["versions"] = page_versions

tk.Label(page_versions, text="Model Version Explorer", font=("Arial",20,"bold")).pack(pady=20)

version_var = tk.StringVar()

version_dropdown = ttk.Combobox(page_versions, textvariable=version_var, state="readonly", width=30)
version_dropdown.pack(pady=10)

metadata_display = tk.Text(page_versions, height=15, width=100, bg="#111", fg="#00ff9c", font=("Consolas",10))
metadata_display.pack(pady=20)

def load_versions():
    if not os.path.exists(MODEL_VERSIONS_DIR):
        return

    versions = sorted(
        [v for v in os.listdir(MODEL_VERSIONS_DIR) if v.startswith("v")],
        key=lambda x:int(x.replace("v",""))
    )

    version_dropdown["values"] = versions

def show_metadata(event=None):
    version = version_var.get()

    if not version:
        return

    metadata_path = os.path.join(MODEL_VERSIONS_DIR, version, "metadata.json")

    if not os.path.exists(metadata_path):
        return

    with open(metadata_path) as f:
        metadata = json.load(f)

    metadata_display.delete("1.0", tk.END)
    metadata_display.insert(tk.END, json.dumps(metadata, indent=4))

version_dropdown.bind("<<ComboboxSelected>>", show_metadata)

# =====================================================
# PAGE 4 — VERSION DASHBOARD
# =====================================================

page_dashboard = tk.Frame(content)
pages["dashboard"] = page_dashboard

tk.Label(page_dashboard, text="Model Version Dashboard", font=("Arial",20,"bold")).pack(pady=20)

columns = ("Version","Dataset Hash","Training Time","Previous Version")

table = ttk.Treeview(page_dashboard, columns=columns, show="headings", height=20)

for col in columns:
    table.heading(col, text=col)
    table.column(col, anchor="center")

table.pack(fill="both", expand=True, padx=40, pady=20)

def load_dashboard():

    for row in table.get_children():
        table.delete(row)

    if not os.path.exists(MODEL_VERSIONS_DIR):
        return

    versions = sorted(
        [v for v in os.listdir(MODEL_VERSIONS_DIR) if v.startswith("v")],
        key=lambda x:int(x.replace("v",""))
    )

    for v in versions:
        metadata_path = os.path.join(MODEL_VERSIONS_DIR, v, "metadata.json")

        if not os.path.exists(metadata_path):
            continue

        with open(metadata_path) as f:
            metadata = json.load(f)

        table.insert(
            "",
            "end",
            values=(
                metadata["version_id"],
                metadata["dataset_hash"][:12] + "...",
                metadata["training_time"][:19],
                metadata["previous_version"]
            )
        )

# =====================================================
# PAGE 5 — LINEAGE VIEWER (CENTERED + SCROLLABLE)
# =====================================================

page_lineage = tk.Frame(content)
pages["lineage"] = page_lineage

tk.Label(page_lineage, text="AI Model Lineage Visualization", font=("Arial",20,"bold")).pack(pady=20)

container = tk.Frame(page_lineage)
container.pack(fill="both", expand=True)

canvas = tk.Canvas(container, bg="#0f172a", highlightthickness=0)
scrollbar = ttk.Scrollbar(container, orient="vertical", command=canvas.yview)

canvas.pack(side="left", fill="both", expand=True)
scrollbar.pack(side="right", fill="y")

scroll_frame = tk.Frame(canvas, bg="#0f172a")

window = canvas.create_window((0, 0), window=scroll_frame, anchor="n")

canvas.configure(yscrollcommand=scrollbar.set)

def center_frame(event):
    canvas_width = event.width
    canvas.itemconfig(window, width=canvas_width)

canvas.bind("<Configure>", center_frame)

scroll_frame.bind(
    "<Configure>",
    lambda e: canvas.configure(scrollregion=canvas.bbox("all"))
)

canvas.bind_all("<MouseWheel>", lambda e: canvas.yview_scroll(int(-1*(e.delta/120)), "units"))

def draw_lineage():

    for widget in scroll_frame.winfo_children():
        widget.destroy()

    if not os.path.exists(MODEL_VERSIONS_DIR):
        return

    versions = sorted(
        [v for v in os.listdir(MODEL_VERSIONS_DIR) if v.startswith("v")],
        key=lambda x:int(x.replace("v",""))
    )

    for i, version in enumerate(versions):

        box = tk.Label(
            scroll_frame,
            text=version,
            bg="#22c55e",
            fg="white",
            font=("Arial",12,"bold"),
            width=12,
            height=2
        )
        box.pack(pady=10)

        if i < len(versions) - 1:
            tk.Label(
                scroll_frame,
                text="↓",
                fg="white",
                bg="#0f172a",
                font=("Arial",16)
            ).pack()

# =====================================================
# PAGE 6 — BLOCKCHAIN
# =====================================================

page_blockchain = tk.Frame(content)
pages["blockchain"] = page_blockchain

tk.Label(page_blockchain, text="Blockchain Registration", font=("Arial",20,"bold")).pack(pady=20)

blockchain_text = tk.Text(page_blockchain, height=12, width=100)
blockchain_text.pack(pady=20)

def prepare_blockchain():

    version = version_var.get()

    if not version:
        messagebox.showerror("Error","Select a version first")
        return

    metadata_path = os.path.join(MODEL_VERSIONS_DIR, version, "metadata.json")

    if not os.path.exists(metadata_path):
        return

    with open(metadata_path) as f:
        metadata = json.load(f)

    blockchain_text.delete("1.0", tk.END)

    blockchain_text.insert(tk.END, "Use these values in Remix\n\n")
    blockchain_text.insert(tk.END, f"modelId:\n{metadata['model_id']}\n\n")
    blockchain_text.insert(tk.END, f"versionId:\n{metadata['version_id']}\n\n")
    blockchain_text.insert(tk.END, f"datasetHash:\n{metadata['dataset_hash']}\n\n")

tk.Button(page_blockchain, text="Prepare Blockchain Data", bg="#2196F3", fg="white", command=prepare_blockchain).pack()

# =====================================================
# SIDEBAR
# =====================================================

tk.Label(sidebar, text="AI Lineage Tracker", fg="white", bg="#1e1e1e", font=("Arial",16,"bold")).pack(pady=20)

def menu_button(text,page):
    tk.Button(sidebar,text=text,bg="#2c2c2c",fg="white",width=25,height=2,command=lambda:show_page(page)).pack(pady=5)

menu_button("Select Model","model")
menu_button("Train Version","train")
menu_button("Version Explorer","versions")
menu_button("Version Dashboard","dashboard")
menu_button("Lineage Viewer","lineage")
menu_button("Blockchain Register","blockchain")

# ---------------- START ----------------

show_page("model")
load_versions()
load_dashboard()
draw_lineage()

root.mainloop()