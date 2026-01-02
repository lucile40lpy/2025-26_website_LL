from flask import Flask, render_template, send_from_directory

app = Flask(__name__)

# Static file routes (keep these for development)
@app.route('/images/<path:filename>')
def serve_images(filename):
    return send_from_directory('static/images', filename)

@app.route('/css/<path:filename>')
def serve_css(filename):
    return send_from_directory('static/css', filename)

@app.route('/js/<path:filename>')
def serve_js(filename):
    return send_from_directory('static/js', filename)

# Website routes
@app.route('/')
def home():
    return render_template('index.html')

@app.route('/take_test')
def take_test():
    return render_template('stuteapot_test.html')

@app.route('/results')
def results():
    return render_template('stuteapot_results.html')

if __name__ == '__main__':
    app.run(debug=True, port=5000)