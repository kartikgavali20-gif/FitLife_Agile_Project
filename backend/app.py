
from flask import Flask, jsonify, request
from flask_cors import CORS
import sqlite3

app = Flask(__name__)
CORS(app)

DATABASE = "fitlife.db"


# Database connection
def get_db_connection():
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn


# Create database tables
def create_database():
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            age INTEGER
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS goals (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            goal TEXT NOT NULL,
            user_id INTEGER,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS activities (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            duration INTEGER NOT NULL,
            user_id INTEGER,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS reminders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            text TEXT NOT NULL,
            time TEXT NOT NULL,
            user_id INTEGER,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    """)


    # Create feedback table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS feedback (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            rating INTEGER NOT NULL,
            comment TEXT NOT NULL,
            user_id INTEGER,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    """)

    conn.commit()
    conn.close()


# Home route
@app.route("/")
def home():
    return "FitLife Backend is Running!"


# Test database
@app.route("/test-db")
def test_db():
    conn = get_db_connection()

    cursor = conn.cursor()
    cursor.execute("""
        SELECT name FROM sqlite_master
        WHERE type='table'
    """)

    tables = [row["name"] for row in cursor.fetchall()]
    conn.close()

    return jsonify({
        "message": "Database connected successfully!",
        "tables": tables
    })


# GET: Display all fitness goals
@app.route("/api/goals", methods=["GET"])
def get_goals():
    conn = get_db_connection()

    goals = conn.execute(
        "SELECT * FROM goals ORDER BY id DESC"
    ).fetchall()

    conn.close()

    return jsonify([dict(goal) for goal in goals])


# PUT: Edit a fitness goal
@app.route("/api/goals/<int:goal_id>", methods=["PUT"])
def edit_goal(goal_id):
    data = request.get_json(silent=True) or {}
    goal = data.get("goal", "").strip()

    if not goal:
        return jsonify({"error": "Goal cannot be empty"}), 400

    conn = get_db_connection()

    cursor = conn.execute(
        "UPDATE goals SET goal = ? WHERE id = ?",
        (goal, goal_id)
    )

    conn.commit()
    updated = cursor.rowcount
    conn.close()

    if updated == 0:
        return jsonify({"error": "Goal not found"}), 404

    return jsonify({"message": "Goal updated successfully!"})


# DELETE: Delete a fitness goal
@app.route("/api/goals/<int:goal_id>", methods=["DELETE"])
def delete_goal(goal_id):
    conn = get_db_connection()

    cursor = conn.execute(
        "DELETE FROM goals WHERE id = ?",
        (goal_id,)
    )

    conn.commit()
    deleted = cursor.rowcount
    conn.close()

    if deleted == 0:
        return jsonify({"error": "Goal not found"}), 404

    return jsonify({"message": "Goal deleted successfully!"})
    
# GET: Display all activities
@app.route("/api/activities", methods=["GET"])
def get_activities():
    conn = get_db_connection()

    activities = conn.execute(
        "SELECT * FROM activities ORDER BY id DESC"
    ).fetchall()

    conn.close()

    return jsonify([dict(item) for item in activities])


# POST: Add an activity
@app.route("/api/activities", methods=["POST"])
def add_activity():
    data = request.get_json(silent=True) or {}

    name = data.get("name", "").strip()

    try:
        duration = int(data.get("duration"))
    except (TypeError, ValueError):
        return jsonify({"error": "Enter a valid duration"}), 400

    if not name:
        return jsonify({"error": "Activity name is required"}), 400

    if duration < 1 or duration > 1440:
        return jsonify({
            "error": "Duration must be between 1 and 1440 minutes"
        }), 400

    conn = get_db_connection()

    cursor = conn.execute(
        "INSERT INTO activities (name, duration) VALUES (?, ?)",
        (name, duration)
    )

    conn.commit()
    activity_id = cursor.lastrowid
    conn.close()

    return jsonify({
        "message": "Activity saved successfully!",
        "id": activity_id
    }), 201


# PUT: Edit an activity
@app.route("/api/activities/<int:activity_id>", methods=["PUT"])
def edit_activity(activity_id):
    data = request.get_json(silent=True) or {}

    name = data.get("name", "").strip()

    try:
        duration = int(data.get("duration"))
    except (TypeError, ValueError):
        return jsonify({"error": "Invalid duration"}), 400

    if not name or duration < 1 or duration > 1440:
        return jsonify({"error": "Invalid activity details"}), 400

    conn = get_db_connection()

    cursor = conn.execute(
        "UPDATE activities SET name = ?, duration = ? WHERE id = ?",
        (name, duration, activity_id)
    )

    conn.commit()
    updated = cursor.rowcount
    conn.close()

    if updated == 0:
        return jsonify({"error": "Activity not found"}), 404

    return jsonify({"message": "Activity updated successfully!"})


# DELETE: Delete an activity
@app.route("/api/activities/<int:activity_id>", methods=["DELETE"])
def delete_activity(activity_id):
    conn = get_db_connection()

    cursor = conn.execute(
        "DELETE FROM activities WHERE id = ?",
        (activity_id,)
    )

    conn.commit()
    deleted = cursor.rowcount
    conn.close()

    if deleted == 0:
        return jsonify({"error": "Activity not found"}), 404

    return jsonify({"message": "Activity deleted successfully!"})


# GET: Display all reminders
@app.route("/api/reminders", methods=["GET"])
def get_reminders():
    conn = get_db_connection()

    reminders = conn.execute(
        "SELECT * FROM reminders ORDER BY id DESC"
    ).fetchall()

    conn.close()

    return jsonify([dict(item) for item in reminders])


# POST: Add reminder
@app.route("/api/reminders", methods=["POST"])
def add_reminder():
    data = request.get_json(silent=True) or {}

    text = data.get("text", "").strip()
    time = data.get("time", "").strip()

    if not text or not time:
        return jsonify({"error": "Enter reminder and time"}), 400

    conn = get_db_connection()

    cursor = conn.execute(
        "INSERT INTO reminders (text, time) VALUES (?, ?)",
        (text, time)
    )

    conn.commit()
    reminder_id = cursor.lastrowid
    conn.close()

    return jsonify({
        "message": "Reminder saved successfully!",
        "id": reminder_id
    }), 201


# DELETE: Delete reminder
@app.route("/api/reminders/<int:reminder_id>", methods=["DELETE"])
def delete_reminder(reminder_id):
    conn = get_db_connection()

    cursor = conn.execute(
        "DELETE FROM reminders WHERE id = ?",
        (reminder_id,)
    )

    conn.commit()
    deleted = cursor.rowcount
    conn.close()

    if deleted == 0:
        return jsonify({"error": "Reminder not found"}), 404

    return jsonify({"message": "Reminder deleted successfully!"})

# POST: Save user profile to SQLite database
@app.route("/api/users", methods=["POST"])
def save_user():
    data = request.get_json(silent=True) or {}

    name = str(data.get("name", "")).strip()

    try:
        age = int(data.get("age"))
    except (TypeError, ValueError):
        return jsonify({"error": "Please enter a valid age"}), 400

    if not name or age <= 0:
        return jsonify({"error": "Enter valid name and age"}), 400

    conn = get_db_connection()

    cursor = conn.execute(
        "INSERT INTO users (name, age) VALUES (?, ?)",
        (name, age)
    )

    conn.commit()
    user_id = cursor.lastrowid
    conn.close()

    return jsonify({
        "message": "Profile saved successfully!",
        "id": user_id
    }), 201

# GET: Display saved user profiles
@app.route("/api/users", methods=["GET"])
def get_users():
    conn = get_db_connection()

    users = conn.execute(
        "SELECT * FROM users ORDER BY id DESC"
    ).fetchall()

    conn.close()

    return jsonify([dict(user) for user in users])

if __name__ == "__main__":
    create_database()
    app.run(debug=True)