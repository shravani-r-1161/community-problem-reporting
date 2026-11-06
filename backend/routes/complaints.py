
from flask import Blueprint, request, jsonify
from models import Complaint
from database import db
from uuid import uuid4

complaints_bp = Blueprint(
    "complaints",
    __name__,
    url_prefix="/api/complaints"
)


# ==========================================
# SUBMIT NEW COMPLAINT
# ==========================================

@complaints_bp.route("/", methods=["POST"])
def create_complaint():

    data = request.get_json(silent=True) or {}

    required = [
        "title",
        "category",
        "description",
        "location"
    ]

    if any(
        not str(data.get(field, "")).strip()
        for field in required
    ):
        return jsonify({
            "message": "All required fields must be filled"
        }), 400

    user_id = data.get("user_id")

    if user_id is not None:

        if not isinstance(user_id, int) or isinstance(user_id, bool):
            return jsonify({
                "message": "Invalid user ID"
            }), 400

    complaint = Complaint(

        complaint_id="CPR" + uuid4().hex[:8].upper(),

        title=data["title"].strip(),

        category=data["category"].strip(),

        description=data["description"].strip(),

        location=data["location"].strip(),

        image=data.get("image"),

        user_id=user_id

    )

    db.session.add(complaint)
    db.session.commit()

    return jsonify({

        "message": "Complaint submitted successfully",

        "complaint": {
            "complaint_id": complaint.complaint_id,
            "title": complaint.title,
            "status": complaint.status
        }

    }), 201


# ==========================================
# GET COMPLAINTS FOR A USER
# ==========================================

@complaints_bp.route("/", methods=["GET"])
def get_complaints():

    user_id = request.args.get("user_id", type=int)

    query = Complaint.query

    if user_id is not None:
        query = query.filter_by(user_id=user_id)

    complaints = query.order_by(
        Complaint.created_at.desc()
    ).all()

    return jsonify([

        {
            "complaint_id": item.complaint_id,

            "title": item.title,

            "category": item.category,

            "description": item.description,

            "location": item.location,

            "image": item.image,

            "status": item.status,

            "user_id": item.user_id,

            "created_at": item.created_at.isoformat()

        }

        for item in complaints

    ]), 200


# ==========================================
# GET ONE COMPLAINT USING COMPLAINT ID
# ==========================================

@complaints_bp.route("/<complaint_id>", methods=["GET"])
def get_complaint(complaint_id):

    complaint = Complaint.query.filter_by(
        complaint_id=complaint_id
    ).first()

    if not complaint:
        return jsonify({
            "message": "Complaint not found"
        }), 404

    return jsonify({

        "complaint_id": complaint.complaint_id,

        "title": complaint.title,

        "category": complaint.category,

        "description": complaint.description,

        "location": complaint.location,

        "image": complaint.image,

        "status": complaint.status,

        "user_id": complaint.user_id,

        "created_at": complaint.created_at.isoformat()

    }), 200
