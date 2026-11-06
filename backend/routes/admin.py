
from flask import Blueprint, request, jsonify
from database import db
from models import User, Complaint

admin_bp = Blueprint("admin", __name__, url_prefix="/api/admin")


def verify_admin(admin_id):
    if not admin_id:
        return None

    return User.query.filter_by(
        id=admin_id,
        role="admin"
    ).first()


@admin_bp.route("/complaints", methods=["GET"])
def get_all_complaints():
    admin_id = request.args.get("admin_id", type=int)

    if not verify_admin(admin_id):
        return jsonify({"message": "Admin access required"}), 403

    complaints = Complaint.query.order_by(
        Complaint.created_at.desc()
    ).all()

    result = []

    for item in complaints:
        result.append({
            "complaint_id": item.complaint_id,
            "title": item.title,
            "category": item.category,
            "description": item.description,
            "location": item.location,
            "image": item.image,
            "status": item.status,
            "user_id": item.user_id,
            "user_name": item.user.name if item.user else "Unknown",
            "created_at": item.created_at.isoformat()
        })

    return jsonify(result), 200


@admin_bp.route("/complaints/<complaint_id>/status", methods=["PUT"])
def update_complaint_status(complaint_id):
    data = request.get_json(silent=True) or {}

    admin_id = data.get("admin_id")
    new_status = data.get("status", "").strip()

    if not verify_admin(admin_id):
        return jsonify({"message": "Admin access required"}), 403

    if new_status not in ["Pending", "In Progress", "Resolved"]:
        return jsonify({"message": "Invalid status"}), 400

    complaint = Complaint.query.filter_by(
        complaint_id=complaint_id
    ).first()

    if not complaint:
        return jsonify({"message": "Complaint not found"}), 404

    complaint.status = new_status
    db.session.commit()

    return jsonify({
        "message": "Complaint status updated successfully",
        "complaint_id": complaint.complaint_id,
        "status": complaint.status
    }), 200
