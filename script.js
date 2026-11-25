
// Load saved data
let goals = JSON.parse(localStorage.getItem("goals")) || [];
let activities = JSON.parse(localStorage.getItem("activities")) || [];
let reminders = JSON.parse(localStorage.getItem("reminders")) || [];


// Save user profile in SQLite database
async function saveProfile() {
    const name = document.getElementById("username").value.trim();
    const age = document.getElementById("age").value;

    if (!name || !age || Number(age) <= 0) {
        alert("Please enter valid details");
        return;
    }

    try {
        const response = await fetch(
            "http://127.0.0.1:5000/api/users",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ name, age })
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || "Profile not saved");
        }

        // Remember the registered user
        localStorage.setItem("user_id", data.id);
        localStorage.setItem("username", name);
        localStorage.setItem("age", age);

        document.getElementById("profileResult").innerText =
            "Welcome " + name + "! Age: " + age;

        alert("Profile saved successfully!");

    } catch (error) {
        alert(error.message);
        console.error(error);
    }
}


// ADD FITNESS GOAL TO DATABASE
async function addGoal() {
    let goal = document.getElementById("goal").value.trim();

    if (goal === "") {
        alert("Please enter a fitness goal!");
        return;
    }

    try {
        const response = await fetch("http://127.0.0.1:5000/api/goals", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ goal: goal })
        });

        const data = await response.json();

        if (!response.ok) {
           throw new Error(data.error || "Could not save goal");
        }

        alert("Goal saved to database!");

        document.getElementById("goal").value = "";
        displayGoals();

    } catch (error) {
        alert("Error saving goal: " + error.message);
    }
}


// DISPLAY GOALS FROM DATABASE
async function displayGoals() {
    let list = document.getElementById("goalList");

    try {
        const response = await fetch("http://127.0.0.1:5000/api/goals");

        if (!response.ok) {
            throw new Error("Could not load goals");
        }

        goals = await response.json();

        list.innerHTML = "";

        goals.forEach(function(goal, index) {
            let li = document.createElement("li");

            li.innerHTML = `
                ${goal.goal}
                <button onclick="editGoal(${index})">Edit</button>
                <button onclick="deleteGoal(${index})">Delete</button>
            `;

            list.appendChild(li);
        });

    } catch (error) {
        console.error("Error loading goals:", error);
    }
}


// EDIT FITNESS GOAL
async function editGoal(index) {
    let goal = goals[index];

    let updatedGoal = prompt("Edit your fitness goal:", goal.goal);

    if (updatedGoal === null) return;

    updatedGoal = updatedGoal.trim();

    if (updatedGoal === "") {
        alert("Goal cannot be empty!");
        return;
    }

    try {
        const response = await fetch(
            `http://127.0.0.1:5000/api/goals/${goal.id}`,
            {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ goal: updatedGoal })
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || "Could not update goal");
        }

        alert("Goal updated successfully!");
        displayGoals();

    } catch (error) {
        alert("Error updating goal: " + error.message);
    }
}


// DELETE FITNESS GOAL
async function deleteGoal(index) {
    if (!confirm("Are you sure you want to delete this goal?")) {
        return;
    }

    let goal = goals[index];

    try {
        const response = await fetch(
            `http://127.0.0.1:5000/api/goals/${goal.id}`,
            {
                method: "DELETE"
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || "Could not delete goal");
        }

        alert("Goal deleted successfully!");
        displayGoals();

    } catch (error) {
        alert("Error deleting goal: " + error.message);
    }
}

// Add workout activity

const ACTIVITY_API = "http://127.0.0.1:5000/api/activities";

// Add activity to SQLite
async function addActivity() {
    const name = document.getElementById("activityName").value.trim();
    const duration = Number(document.getElementById("duration").value);

    if (!name) {
        alert("Please enter an activity name!");
        return;
    }

    if (!Number.isInteger(duration) || duration < 1 || duration > 1440) {
        alert("Duration must be between 1 and 1440 minutes!");
        return;
    }

    try {
        const response = await fetch(ACTIVITY_API, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ name, duration })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || "Unable to save activity");
        }

        document.getElementById("activityName").value = "";
        document.getElementById("duration").value = "";

        alert("Activity saved in database!");

        await displayActivities();

    } catch (error) {
        alert(error.message);
    }
}


// Display activities from SQLite
async function displayActivities() {
    const list = document.getElementById("activityList");
    list.innerHTML = "";

    try {
        const response = await fetch(ACTIVITY_API);

        if (!response.ok) {
            throw new Error("Unable to load activities");
        }

        activities = await response.json();

        activities.forEach(function(item) {
            const li = document.createElement("li");

            const details = document.createElement("span");
            details.textContent =
                item.name + " - " + item.duration + " minutes ";

            const editButton = document.createElement("button");
            editButton.textContent = "Edit";

            editButton.onclick = function() {
                editActivity(item.id, item.name, item.duration);
            };

            const deleteButton = document.createElement("button");
            deleteButton.textContent = "Delete";

            deleteButton.onclick = function() {
                deleteActivity(item.id);
            };

            li.appendChild(details);
            li.appendChild(editButton);
            li.appendChild(deleteButton);

            list.appendChild(li);
        });

        updateChart();

    } catch (error) {
        list.textContent = "Unable to load activities. Check Flask server.";
        console.error(error);
    }
}


// Edit activity in SQLite
async function editActivity(id, oldName, oldDuration) {
    let name = prompt("Enter activity name:", oldName);

    if (name === null) return;

    name = name.trim();

    let durationInput = prompt(
        "Enter duration in minutes:",
        oldDuration
    );

    if (durationInput === null) return;

    const duration = Number(durationInput);

    if (!name || !Number.isInteger(duration) ||
        duration < 1 || duration > 1440) {
        alert("Please enter valid activity details!");
        return;
    }

    try {
        const response = await fetch(ACTIVITY_API + "/" + id, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ name, duration })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || "Update failed");
        }

        alert("Activity updated successfully!");
        await displayActivities();

    } catch (error) {
        alert(error.message);
    }
}


// Delete activity from SQLite
async function deleteActivity(id) {
    if (!confirm("Are you sure you want to delete this activity?")) {
        return;
    }

    try {
        const response = await fetch(ACTIVITY_API + "/" + id, {
            method: "DELETE"
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || "Delete failed");
        }

        alert("Activity deleted successfully!");
        await displayActivities();

    } catch (error) {
        alert(error.message);
    }
}


const REMINDER_API = "http://127.0.0.1:5000/api/reminders";

// Add reminder to database
async function addReminder() {
    alert("Reminder function is working!");
    const text = document.getElementById("reminderText").value.trim();
    const time = document.getElementById("reminderTime").value;

    if (!text || !time) {
        alert("Enter reminder and time!");
        return;
    }

    try {
        const response = await fetch(REMINDER_API, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ text, time })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || "Could not save reminder");
        }

        alert("Reminder saved in database!");

        document.getElementById("reminderText").value = "";
        document.getElementById("reminderTime").value = "";

        displayReminders();

    } catch (error) {
        alert(error.message);
    }
}


// Display reminders from database
async function displayReminders() {
    const list = document.getElementById("reminderList");
    list.innerHTML = "";

    try {
        const response = await fetch(REMINDER_API);

        if (!response.ok) {
            throw new Error("Could not load reminders");
        }

        const reminders = await response.json();

        reminders.forEach(function(item) {
            const li = document.createElement("li");

            const details = document.createElement("span");
            details.textContent =
                item.text + " - " +
                new Date(item.time).toLocaleString() + " ";

            const deleteButton = document.createElement("button");
            deleteButton.textContent = "Delete";

            deleteButton.onclick = function() {
                deleteReminder(item.id);
            };

            li.appendChild(details);
            li.appendChild(deleteButton);
            list.appendChild(li);
        });

    } catch (error) {
        list.textContent = "Unable to load reminders.";
        console.error(error);
    }
}


// Delete reminder from database
async function deleteReminder(id) {
    if (!confirm("Delete this reminder?")) return;

    try {
        const response = await fetch(REMINDER_API + "/" + id, {
            method: "DELETE"
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || "Delete failed");
        }

        alert("Reminder deleted!");
        displayReminders();

    } catch (error) {
        alert(error.message);
    }
}


// Progress chart
let progressChart;

 
function updateChart() {
    const canvas = document.getElementById("progressChart");

    // Check whether the chart canvas exists
    if (!canvas) {
        console.error("Progress chart canvas not found!");
        return;
    }

    let labels = activities.map(item => item.name);
    let values = activities.map(item => item.duration);

    if (progressChart) {
        progressChart.destroy();
    }

    const ctx = canvas.getContext("2d");

    progressChart = new Chart(ctx, {
        type: "bar",
        data: {
            labels: labels,
            datasets: [{
                label: "Workout Minutes",
                data: values,
                backgroundColor: "#2563eb"
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}


// Display previously saved information
window.onload = function() {
    let name = localStorage.getItem("username");
    let age = localStorage.getItem("age");

    if (name && age) {
        document.getElementById("username").value = name;
        document.getElementById("age").value = age;
        document.getElementById("profileResult").innerText =
            "Welcome " + name + "! Age: " + age;
    }

    displayGoals();
    displayActivities();
    displayReminders();
    updateChart();
};


// AGILE TASK BOARD

let tasks = JSON.parse(localStorage.getItem("agileTasks")) || [
    {id: 1, name: "Create User Profile", status: "done"},
    {id: 2, name: "Fitness Goals", status: "done"},
    {id: 3, name: "Activity Tracking", status: "progress"},
    {id: 4, name: "Fitness Reminders", status: "todo"},
    {id: 5, name: "Progress Reports", status: "todo"}
];

function saveTasks() {
    localStorage.setItem("agileTasks", JSON.stringify(tasks));
}

function displayTasks() {

    document.getElementById("todo").innerHTML = "";
    document.getElementById("progress").innerHTML = "";
    document.getElementById("done").innerHTML = "";

    tasks.forEach(function(task) {

        let div = document.createElement("div");
        div.className = "task";

        let title = document.createElement("p");
        title.innerText = task.name;

        let select = document.createElement("select");

        [
            ["todo", "To Do"],
            ["progress", "In Progress"],
            ["done", "Done"]
        ].forEach(function(option) {
            let opt = document.createElement("option");
            opt.value = option[0];
            opt.textContent = option[1];
            select.appendChild(opt);
        });

        select.value = task.status;

        select.onchange = function() {
            task.status = select.value;
            saveTasks();
            displayTasks();
        };

        let deleteButton = document.createElement("button");
        deleteButton.innerText = "Delete";

        deleteButton.onclick = function() {
            tasks = tasks.filter(t => t.id !== task.id);
            saveTasks();
            displayTasks();
        };

        div.appendChild(title);
        div.appendChild(select);
        div.appendChild(deleteButton);

        document.getElementById(task.status).appendChild(div);
    });
}

function addTask() {

    let name = document.getElementById("taskName").value.trim();
    let status = document.getElementById("taskStatus").value;

    if (name === "") {
        alert("Please enter a task name");
        return;
    }

    tasks.push({
        id: Date.now(),
        name: name,
        status: status
    });

    saveTasks();

    document.getElementById("taskName").value = "";

    displayTasks();
}

// Show tasks when website loads
displayTasks();


// SPRINT VELOCITY

let velocityChart;

function updateVelocity() {

    let completed = tasks.filter(
        task => task.status === "done"
    ).length;

    let pending = tasks.filter(
        task => task.status !== "done"
    ).length;

    let total = tasks.length;

    let rate = total === 0 ? 0 :
        Math.round((completed / total) * 100);

    document.getElementById("completedTasks").innerText = completed;
    document.getElementById("pendingTasks").innerText = pending;
    document.getElementById("completionRate").innerText = rate + "%";

    if (velocityChart) {
        velocityChart.destroy();
    }

    velocityChart = new Chart(
        document.getElementById("velocityChart"),
        {
            type: "bar",
            data: {
                labels: ["Completed", "Pending"],
                datasets: [{
                    label: "Number of Tasks",
                    data: [completed, pending],
                    backgroundColor: ["#16a34a", "#f59e0b"]
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                }
            }
        }
    );
}

// SPRINT REVIEW FEEDBACK

function saveReview() {

    let feedback = document.getElementById(
        "reviewFeedback"
    ).value.trim();

    if (feedback === "") {
        alert("Please enter feedback");
        return;
    }

    localStorage.setItem("reviewFeedback", feedback);

    document.getElementById("reviewResult").innerText =
        "Feedback saved successfully!";

}

// SPRINT RETROSPECTIVE

function saveRetrospective() {

    let well = document.getElementById("wentWell").value.trim();
    let improve = document.getElementById("improvement").value.trim();
    let action = document.getElementById("actionPlan").value.trim();

    if (!well || !improve || !action) {
        alert("Please fill all retrospective fields");
        return;
    }

    let retrospective = {
        wentWell: well,
        improvement: improve,
        actionPlan: action
    };

    localStorage.setItem(
        "retrospective",
        JSON.stringify(retrospective)
    );

    document.getElementById("retroResult").innerText =
        "Retrospective saved successfully!";

}

// Update velocity whenever task board changes
const originalDisplayTasks = displayTasks;

displayTasks = function() {
    originalDisplayTasks();
    updateVelocity();
};

// Load velocity chart
updateVelocity();

displayGoals();
displayReminders();


// Get currently saved user ID
function getCurrentUserId() {
    return localStorage.getItem("user_id");
}

// Display saved profile when website opens
window.addEventListener("DOMContentLoaded", function () {

    const name = localStorage.getItem("username");
    const age = localStorage.getItem("age");

    if (name && age) {
        document.getElementById("profileResult").innerText =
            "Welcome " + name + "! Age: " + age;
    }

});
