
from datetime import datetime

from werkzeug.security import (
    generate_password_hash,
    check_password_hash
)

from database import db


# ==========================================
# USER TABLE
# ==========================================

class User(db.Model):

    __tablename__ = "users"

    id = db.Column(
        db.Integer,
        primary_key=True
    )

    name = db.Column(
        db.String(100),
        nullable=False
    )

    email = db.Column(
        db.String(120),
        unique=True,
        nullable=False
    )

    phone = db.Column(
        db.String(15)
    )

    password_hash = db.Column(
        db.String(256),
        nullable=False
    )

    role = db.Column(
        db.String(20),
        default="citizen"
    )

    created_at = db.Column(
        db.DateTime,
        default=datetime.utcnow
    )


    # Hash password before storing
    def set_password(self, password):

        self.password_hash = generate_password_hash(password)


    # Check entered password
    def check_password(self, password):

        return check_password_hash(
            self.password_hash,
            password
        )


# ==========================================
# COMPLAINT TABLE
# ==========================================

class Complaint(db.Model):

    __tablename__ = "complaints"

    id = db.Column(
        db.Integer,
        primary_key=True
    )

    complaint_id = db.Column(
        db.String(30),
        unique=True,
        nullable=False
    )

    title = db.Column(
        db.String(200),
        nullable=False
    )

    category = db.Column(
        db.String(100),
        nullable=False
    )

    description = db.Column(
        db.Text,
        nullable=False
    )

    location = db.Column(
        db.String(300),
        nullable=False
    )

    # Text column supports base64 image data
    image = db.Column(
        db.Text
    )

    status = db.Column(
        db.String(30),
        default="Pending"
    )

    user_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id")
    )

    created_at = db.Column(
        db.DateTime,
        default=datetime.utcnow
    )

    user = db.relationship(
        "User",
        backref="complaints"
    )
