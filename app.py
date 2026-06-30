from flask import Flask, render_template

app = Flask(__name__)

@app.route('/')
@app.route('/inicio')
def inicio():
    return render_template('inicio.html')

# Rutas temporales para que no tire error el navbar
@app.route('/heatmap')
def heatmap(): return "Página Heatmap (Pendiente Integrante 2)"
@app.route('/atenuacion')
def atenuacion(): return "Página Atenuación (Pendiente Integrante 3)"
@app.route('/propagacion')
def propagacion(): return "Página Propagación (Pendiente Integrante 4)"
@app.route('/conclusiones')
def conclusiones(): return "Página Conclusiones (Pendiente Integrante 5)"

if __name__ == '__main__':
    app.run(debug=True, port=5000)
