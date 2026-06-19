"""initial schema
 
Revision ID: 0001_initial
Revises:
Create Date: 2025-06-15
 
Creates all tables for RCCG Ride Connect:
  users, rides, ride_requests, message_threads,
  messages, emergency_alerts, ratings
"""
 
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
 
revision: str = "0001_initial"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None
 
 
def upgrade() -> None:
    # ── users ────────────────────────────────────────────────────────────────
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("full_name", sa.String(length=120), nullable=False),
        sa.Column("phone", sa.String(length=20), nullable=False),
        sa.Column("hashed_password", sa.String(length=255), nullable=False),
        sa.Column(
            "role",
            sa.Enum("rider", "driver", name="userrole"),
            nullable=False,
        ),
        sa.Column("parish", sa.String(length=200), nullable=True),
        sa.Column("is_verified", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("selfie_url", sa.String(length=500), nullable=True),
        sa.Column("nin_url", sa.String(length=500), nullable=True),
        sa.Column("licence_url", sa.String(length=500), nullable=True),
        sa.Column("car_photo_url", sa.String(length=500), nullable=True),
        sa.Column("car_make", sa.String(length=80), nullable=True),
        sa.Column("car_model", sa.String(length=80), nullable=True),
        sa.Column("car_year", sa.Integer(), nullable=True),
        sa.Column("car_colour", sa.String(length=40), nullable=True),
        sa.Column("car_plate", sa.String(length=20), nullable=True),
        sa.Column("average_rating", sa.Float(), nullable=False, server_default="0.0"),
        sa.Column("total_ratings", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("total_rides", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("emergency_contact_name", sa.String(length=120), nullable=True),
        sa.Column("emergency_contact_phone", sa.String(length=20), nullable=True),
        sa.Column("phone_verified", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_users_id"), "users", ["id"], unique=False)
    op.create_index(op.f("ix_users_phone"), "users", ["phone"], unique=True)
 
    # ── rides ─────────────────────────────────────────────────────────────────
    op.create_table(
        "rides",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("driver_id", sa.Integer(), nullable=False),
        sa.Column("origin", sa.String(length=200), nullable=False),
        sa.Column("destination", sa.String(length=200), nullable=False),
        sa.Column("route_description", sa.Text(), nullable=True),
        sa.Column("departure_time", sa.String(length=50), nullable=False),
        sa.Column("total_seats", sa.Integer(), nullable=False),
        sa.Column("seats_taken", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("cost_per_rider", sa.Float(), nullable=False, server_default="0.0"),
        sa.Column("driver_note", sa.Text(), nullable=True),
        sa.Column(
            "status",
            sa.Enum("open", "full", "in_progress", "completed", "cancelled", name="ridestatus"),
            nullable=False,
            server_default="open",
        ),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["driver_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_rides_driver_id"), "rides", ["driver_id"], unique=False)
    op.create_index(op.f("ix_rides_id"), "rides", ["id"], unique=False)
    op.create_index(op.f("ix_rides_status"), "rides", ["status"], unique=False)
 
    # ── message_threads ───────────────────────────────────────────────────────
    op.create_table(
        "message_threads",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("driver_id", sa.Integer(), nullable=False),
        sa.Column("rider_id", sa.Integer(), nullable=False),
        sa.Column("ride_id", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["driver_id"], ["users.id"]),
        sa.ForeignKeyConstraint(["ride_id"], ["rides.id"]),
        sa.ForeignKeyConstraint(["rider_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
 
    # ── ride_requests ─────────────────────────────────────────────────────────
    op.create_table(
        "ride_requests",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("ride_id", sa.Integer(), nullable=False),
        sa.Column("rider_id", sa.Integer(), nullable=False),
        sa.Column("drop_off_note", sa.String(length=200), nullable=True),
        sa.Column(
            "status",
            sa.Enum("pending", "accepted", "declined", "cancelled", name="requeststatus"),
            nullable=False,
            server_default="pending",
        ),
        sa.Column("meetup_point", sa.String(length=200), nullable=True),
        sa.Column("thread_id", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["message_threads.id"], ["message_threads.id"]),
        sa.ForeignKeyConstraint(["ride_id"], ["rides.id"]),
        sa.ForeignKeyConstraint(["rider_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_ride_requests_id"), "ride_requests", ["id"], unique=False)
    op.create_index(op.f("ix_ride_requests_ride_id"), "ride_requests", ["ride_id"], unique=False)
    op.create_index(op.f("ix_ride_requests_rider_id"), "ride_requests", ["rider_id"], unique=False)
    op.create_index(op.f("ix_ride_requests_status"), "ride_requests", ["status"], unique=False)
 
    # ── messages ──────────────────────────────────────────────────────────────
    op.create_table(
        "messages",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("thread_id", sa.Integer(), nullable=False),
        sa.Column("sender_id", sa.Integer(), nullable=False),
        sa.Column("body", sa.Text(), nullable=False),
        sa.Column("is_read", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["sender_id"], ["users.id"]),
        sa.ForeignKeyConstraint(["thread_id"], ["message_threads.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_messages_id"), "messages", ["id"], unique=False)
    op.create_index(op.f("ix_messages_thread_id"), "messages", ["thread_id"], unique=False)
 
    # ── emergency_alerts ──────────────────────────────────────────────────────
    op.create_table(
        "emergency_alerts",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("ride_request_id", sa.Integer(), nullable=True),
        sa.Column("ride_snapshot", sa.Text(), nullable=True),
        sa.Column("trusted_contact_phone", sa.String(length=20), nullable=True),
        sa.Column("trusted_contact_name", sa.String(length=120), nullable=True),
        sa.Column("resolved", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("resolved_note", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("resolved_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["ride_request_id"], ["ride_requests.id"]),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_emergency_alerts_id"), "emergency_alerts", ["id"], unique=False)
    op.create_index(op.f("ix_emergency_alerts_user_id"), "emergency_alerts", ["user_id"], unique=False)
 
    # ── ratings ───────────────────────────────────────────────────────────────
    op.create_table(
        "ratings",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("rater_id", sa.Integer(), nullable=False),
        sa.Column("ratee_id", sa.Integer(), nullable=False),
        sa.Column("ride_request_id", sa.Integer(), nullable=False),
        sa.Column("score", sa.Float(), nullable=False),
        sa.Column("comment", sa.Text(), nullable=True),
        sa.Column("tags", sa.String(length=300), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.CheckConstraint("score >= 1.0 AND score <= 5.0", name="rating_score_range"),
        sa.ForeignKeyConstraint(["ratee_id"], ["users.id"]),
        sa.ForeignKeyConstraint(["rater_id"], ["users.id"]),
        sa.ForeignKeyConstraint(["ride_request_id"], ["ride_requests.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
 
 
def downgrade() -> None:
    op.drop_table("ratings")
    op.drop_table("emergency_alerts")
    op.drop_table("messages")
    op.drop_table("ride_requests")
    op.drop_table("message_threads")
    op.drop_table("rides")
    op.drop_table("users")
    op.execute("DROP TYPE IF EXISTS userrole")
    op.execute("DROP TYPE IF EXISTS ridestatus")
    op.execute("DROP TYPE IF EXISTS requeststatus")