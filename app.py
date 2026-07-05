"""
app.py — Backend Flask del proyecto "Análisis de señal WiFi FISI"

Cómo correrlo:
  1. pip install flask pandas
  2. python app.py
  3. Abrir http://localhost:5000
"""

from flask import Flask, render_template, jsonify
import pandas as pd
import os

app = Flask(__name__)

# Rutas a los archivos de datos
DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
MEDICIONES_CSV = os.path.join(DATA_DIR, "mediciones.csv")
ATENUACION_CSV = os.path.join(DATA_DIR, "atenuacion.csv")


# ---------------------------------------------------------------------------
# RUTAS DE PÁGINAS (devuelven HTML)
# ---------------------------------------------------------------------------

@app.route("/")
@app.route("/inicio")
def inicio():
    return render_template("inicio.html")


@app.route("/heatmap")
def heatmap():
    return render_template("heatmap.html")


@app.route("/atenuacion")
def atenuacion():
    # Ruta de I3
    return render_template("atenuacion.html")


@app.route("/propagacion")
def propagacion():
    return render_template("propagacion.html")


@app.route("/conclusiones")
def conclusiones():
    return render_template("conclusiones.html")


# ---------------------------------------------------------------------------
# RUTAS DE API (devuelven JSON, las usan I3, I4 e I5 para sus gráficas/tablas)
# ---------------------------------------------------------------------------

@app.route("/api/datos")
def api_datos():
    """
    Lee data/mediciones.csv y devuelve todos los puntos medidos en JSON.
    """
    try:
        df = pd.read_csv(MEDICIONES_CSV)
        return jsonify(df.to_dict(orient="records"))
    except FileNotFoundError:
        return jsonify({"error": f"No se encontró {MEDICIONES_CSV}"}), 404

@app.route("/api/atenuacion")
def api_atenuacion():
    """
    Lee data/atenuacion.csv y devuelve la pérdida por material en JSON.
    Columnas esperadas en el CSV:
      material, dbm_antes, dbm_despues
    Si la columna 'perdida_db' no existe, se calcula aquí: L = dbm_antes - dbm_despues
    Usada por: atenuacion.html, conclusiones.html
    """
    try:
        df = pd.read_csv(ATENUACION_CSV)
        if "perdida_db" not in df.columns:
            df["perdida_db"] = df["dbm_antes"] - df["dbm_despues"]
        return jsonify(df.to_dict(orient="records"))
    except FileNotFoundError:
        return jsonify({"error": f"No se encontró {ATENUACION_CSV}"}), 404


if __name__ == "__main__":
    app.run(debug=True)
