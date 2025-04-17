from flask import Flask, request, jsonify, render_template, send_from_directory
from werkzeug.utils import secure_filename
from dotenv import load_dotenv
from transformers import AutoProcessor, AutoModelForImageTextToText
from PIL import Image
import torch
from datetime import datetime
import os
import sqlite3

# Load env vars
load_dotenv()

# Flask setup
app = Flask(__name__)
UPLOAD_FOLDER = 'uploads'
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Load model (offline)
MODEL_PATH = "./models/Salesforce/blip-image-captioning-base"
processor = AutoProcessor.from_pretrained(MODEL_PATH, local_files_only=True)
model = AutoModelForImageTextToText.from_pretrained(MODEL_PATH, local_files_only=True)

# Init DB
def init_db():
    with sqlite3.connect('captions.db') as conn:
        conn.execute('''
            CREATE TABLE IF NOT EXISTS uploads (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                filename TEXT,
                caption TEXT,
                upload_date TEXT
            )
        ''')

init_db()

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/upload", methods=["POST"])
def upload():
    file = request.files.get('imageFile')
    if not file or file.filename == '':
        return "No file uploaded!", 400

    filename = secure_filename(file.filename)
    filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    file.save(filepath)

    # Proses gambar
    image = Image.open(filepath).convert('RGB')
    inputs = processor(images=image, return_tensors="pt")
    output = model.generate(**inputs)
    caption = processor.batch_decode(output, skip_special_tokens=True)[0]

    # Simpan ke DB
    upload_date = datetime.now().strftime("%d-%m-%Y %H:%M:%S")
    with sqlite3.connect('captions.db') as conn:
        conn.execute('''
            INSERT INTO uploads (filename, caption, upload_date)
            VALUES (?, ?, ?)
        ''', (filename, caption, upload_date))

    return caption

@app.route("/uploads/<filename>")
def uploaded_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

@app.route("/history", methods=["GET"])
def get_history():
    with sqlite3.connect('captions.db') as conn:
        cursor = conn.execute('''
            SELECT filename, caption, upload_date
            FROM uploads
            ORDER BY upload_date ASC
        ''')
        rows = cursor.fetchall()
    return jsonify([
        {"filename": row[0], "caption": row[1], "upload_date": row[2]} for row in rows
    ])

@app.route("/delete_history", methods=["POST"])
def delete_history():
    with sqlite3.connect('captions.db') as conn:
        conn.execute('DELETE FROM uploads')
    return jsonify({"status": "success", "message": "History deleted."})

if __name__ == "__main__":
    app.run(debug=True)