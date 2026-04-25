document.addEventListener('DOMContentLoaded', () => {
    const timeline = document.getElementById('planner-timeline');
    const modal = document.getElementById('task-modal');
    const openModalBtn = document.getElementById('open-add-modal');
    const closeModalBtn = document.getElementById('close-modal');
    const saveTaskBtn = document.getElementById('save-task');
    const filterBtns = document.querySelectorAll('.filter-btn');

    let currentFilter = 'all';

    // UI elements for task addition
    const taskDate = document.getElementById('task-date');
    const taskTime = document.getElementById('task-time');
    const taskType = document.getElementById('task-type');
    const taskTitle = document.getElementById('task-title');
    const taskNotes = document.getElementById('task-notes');

    // Default date to today
    taskDate.valueAsDate = new Date();

    function getTasks() {
        return JSON.parse(localStorage.getItem('oi_planner_detailed') || '[]');
    }

    function saveTasks(tasks) {
        localStorage.setItem('oi_planner_detailed', JSON.stringify(tasks));
    }

    function render() {
        const tasks = getTasks();
        timeline.innerHTML = '';

        if (tasks.length === 0) {
            timeline.innerHTML = '<div style="text-align:center; padding: 40px; color: #888;">No tasks planned yet. Click the button above to start!</div>';
            return;
        }

        // Filter tasks
        const filteredTasks = currentFilter === 'all' 
            ? tasks 
            : tasks.filter(t => t.type === currentFilter);

        // Group by date
        const groups = {};
        filteredTasks.forEach(task => {
            if (!groups[task.date]) groups[task.date] = [];
            groups[task.date].push(task);
        });

        // Sort dates
        const sortedDates = Object.keys(groups).sort();

        sortedDates.forEach(dateStr => {
            const dateTasks = groups[dateStr];
            // Sort by time
            dateTasks.sort((a, b) => (a.time || '00:00').localeCompare(b.time || '00:00'));

            const dayGroup = document.createElement('div');
            dayGroup.className = 'planner-day-group';

            const date = new Date(dateStr + 'T00:00:00');
            const dateLabel = date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' });

            dayGroup.innerHTML = `
                <div class="day-header">
                    <span>${dateLabel}</span>
                    ${isToday(date) ? '<span class="date-badge">Today</span>' : ''}
                </div>
                <div class="task-cards-list">
                    ${dateTasks.map(task => `
                        <div class="task-card type-${task.type} ${task.done ? 'done' : ''}" data-id="${task.id}">
                            <div class="task-check">
                                <input type="checkbox" ${task.done ? 'checked' : ''} onchange="toggleTask('${task.id}')">
                            </div>
                            <div class="task-info">
                                <div class="task-title-row">
                                    <span class="task-title">${task.title}</span>
                                    ${task.time ? `<span class="task-time-badge">${task.time}</span>` : ''}
                                </div>
                                ${task.notes ? `<div class="task-notes">${task.notes}</div>` : ''}
                            </div>
                            <div class="task-actions">
                                <button class="delete-task-btn" onclick="deleteTask('${task.id}')">&times;</button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
            timeline.appendChild(dayGroup);
        });
    }

    function isToday(someDate) {
        const today = new Date();
        return someDate.getDate() == today.getDate() &&
            someDate.getMonth() == today.getMonth() &&
            someDate.getFullYear() == today.getFullYear();
    }

    window.toggleTask = (id) => {
        const tasks = getTasks();
        const task = tasks.find(t => t.id === id);
        if (task) {
            task.done = !task.done;
            saveTasks(tasks);
            render();
        }
    };

    window.deleteTask = (id) => {
        if (!confirm('Are you sure you want to delete this task?')) return;
        let tasks = getTasks();
        tasks = tasks.filter(t => t.id !== id);
        saveTasks(tasks);
        render();
    };

    // Modal Handlers
    openModalBtn.onclick = () => {
        modal.style.display = 'flex';
        taskTitle.focus();
    };

    closeModalBtn.onclick = () => {
        modal.style.display = 'none';
    };

    saveTaskBtn.onclick = () => {
        const title = taskTitle.value.trim();
        if (!title) {
            alert('Please enter a title');
            return;
        }

        const tasks = getTasks();
        const newTask = {
            id: Date.now().toString(),
            date: taskDate.value,
            time: taskTime.value,
            type: taskType.value,
            title: title,
            notes: taskNotes.value.trim(),
            done: false
        };

        tasks.push(newTask);
        saveTasks(tasks);
        
        // Reset and close
        taskTitle.value = '';
        taskNotes.value = '';
        modal.style.display = 'none';
        
        render();
    };

    // Filter Logic
    filterBtns.forEach(btn => {
        btn.onclick = () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.dataset.filter;
            render();
        };
    });

    // Initial render
    render();

    // Standard Navbar logic
    const currentUsername = localStorage.getItem('username');
    if (currentUsername) {
        document.getElementById('welcome-message').textContent = `Welcome, ${currentUsername}`;
    }
    document.getElementById('logout-button').onclick = () => {
        localStorage.removeItem('sessionToken');
        localStorage.removeItem('username');
        window.location.href = '/';
    };
});
