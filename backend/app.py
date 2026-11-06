
from flask import Flask, jsonify
from flask_cors import CORS

from database import init_db
from routes.auth import auth_bp
from routes.complaints import complaints_bp
from routes.admin import admin_bp

app = Flask(__name__)

app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///community.db"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

CORS(app)

init_db(app)

# Register all application routes
app.register_blueprint(auth_bp)
app.register_blueprint(complaints_bp)
app.register_blueprint(admin_bp)


@app.route("/")
def home():
    return jsonify({
        "message": "CommunityConnect Backend is running!",
        "status": "success"
    })


if __name__ == "__main__":
    app.run(debug=True, port=5000)
