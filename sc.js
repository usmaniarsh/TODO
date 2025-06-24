    document.addEventListener('DOMContentLoaded', function() {
            // DOM Elements
            const sidebar = document.getElementById('sidebar');
            const menuToggle = document.getElementById('menuToggle');
            const taskListsContainer = document.getElementById('taskLists');
            const addListBtn = document.getElementById('addListBtn');
            const currentListTitle = document.getElementById('currentListTitle');
            const taskInput = document.getElementById('taskInput');
            const addTaskBtn = document.getElementById('addTaskBtn');
            const tasksContainer = document.getElementById('tasksContainer');
            const themeToggle = document.getElementById('themeToggle');
            const settingsBtn = document.getElementById('settingsBtn');
            const sortTasksBtn = document.getElementById('sortTasksBtn');
            const taskFormModal = document.getElementById('taskFormModal');
            const taskForm = document.getElementById('taskForm');
            const closeModalBtn = document.getElementById('closeModalBtn');
            const cancelEditBtn = document.getElementById('cancelEditBtn');
            const modalTitle = document.getElementById('modalTitle');
            const listFormModal = document.getElementById('listFormModal');
            const listForm = document.getElementById('listForm');
            const closeListModalBtn = document.getElementById('closeListModalBtn');
            const cancelListBtn = document.getElementById('cancelListBtn');
            const settingsModal = document.getElementById('settingsModal');
            const closeSettingsBtn = document.getElementById('closeSettingsBtn');
            const settingsTabs = document.querySelectorAll('.settings-tab');
            const themeOptions = document.querySelectorAll('.theme-option');
            const wallpaperItems = document.querySelectorAll('.wallpaper-item');

            // State
            let taskLists = JSON.parse(localStorage.getItem('taskLists')) || [
                { id: 'default', name: 'My Tasks', icon: 'fas fa-tasks', tasks: [] }
            ];
            let currentListId = 'default';
            let currentTheme = localStorage.getItem('theme') || 'light';
            let currentWallpaper = localStorage.getItem('wallpaper') || 'none';
            let editingTaskId = null;
            let sortOrder = 'default';

            // Initialize
            applyTheme(currentTheme);
            applyWallpaper(currentWallpaper);
            renderTaskLists();
            renderTasks();

            // Event Listeners
            menuToggle.addEventListener('click', function() {
                sidebar.classList.toggle('open');
            });

            addListBtn.addEventListener('click', function() {
                listFormModal.classList.add('show');
            });

            addTaskBtn.addEventListener('click', addTask);
            taskInput.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') addTask();
            });
            
            themeToggle.addEventListener('click', toggleTheme);
            settingsBtn.addEventListener('click', function() {
                settingsModal.classList.add('show');
                // Set active states in settings modal
                document.querySelector(`.theme-option[data-theme="${currentTheme}"]`).classList.add('active');
                document.querySelector(`.wallpaper-item[data-wallpaper="${currentWallpaper}"]`).classList.add('active');
            });
            
            sortTasksBtn.addEventListener('click', toggleSortOrder);
            
            taskForm.addEventListener('submit', function(e) {
                e.preventDefault();
                saveTask();
            });
            
            closeModalBtn.addEventListener('click', closeModal);
            cancelEditBtn.addEventListener('click', closeModal);

            listForm.addEventListener('submit', function(e) {
                e.preventDefault();
                createNewList();
            });

            closeListModalBtn.addEventListener('click', closeListModal);
            cancelListBtn.addEventListener('click', closeListModal);

            closeSettingsBtn.addEventListener('click', function() {
                settingsModal.classList.remove('show');
            });

            settingsTabs.forEach(tab => {
                tab.addEventListener('click', function() {
                    settingsTabs.forEach(t => t.classList.remove('active'));
                    document.querySelectorAll('.settings-content').forEach(c => c.classList.remove('active'));
                    this.classList.add('active');
                    document.getElementById(`${this.dataset.tab}Tab`).classList.add('active');
                });
            });

            themeOptions.forEach(option => {
                option.addEventListener('click', function() {
                    themeOptions.forEach(o => o.classList.remove('active'));
                    this.classList.add('active');
                    currentTheme = this.dataset.theme;
                    applyTheme(currentTheme);
                    localStorage.setItem('theme', currentTheme);
                });
            });

            wallpaperItems.forEach(item => {
                item.addEventListener('click', function() {
                    wallpaperItems.forEach(i => i.classList.remove('active'));
                    this.classList.add('active');
                    currentWallpaper = this.dataset.wallpaper;
                    applyWallpaper(currentWallpaper);
                    localStorage.setItem('wallpaper', currentWallpaper);
                });
            });

            // Functions
            function addTask() {
                const title = taskInput.value.trim();
                if (title) {
                    const currentList = taskLists.find(list => list.id === currentListId);
                    if (currentList) {
                        const newTask = {
                            id: Date.now().toString(),
                            title,
                            description: '',
                            dueDate: '',
                            priority: 'medium',
                            completed: false,
                            createdAt: new Date().toISOString()
                        };
                        currentList.tasks.unshift(newTask);
                        saveTaskLists();
                        taskInput.value = '';
                        renderTasks();
                        renderTaskLists();
                    }
                }
            }

            function renderTaskLists() {
                taskListsContainer.innerHTML = '';
                
                taskLists.forEach(list => {
                    const activeClass = list.id === currentListId ? 'active' : '';
                    const completedCount = list.tasks.filter(task => task.completed).length;
                    const totalCount = list.tasks.length;
                    
                    const listElement = document.createElement('div');
                    listElement.className = `task-list-item ${activeClass}`;
                    listElement.dataset.id = list.id;
                    listElement.innerHTML = `
                        <i class="${list.icon}"></i>
                        <span>${list.name}</span>
                        <span class="count">${completedCount}/${totalCount}</span>
                    `;
                    
                    listElement.addEventListener('click', function() {
                        currentListId = list.id;
                        currentListTitle.textContent = list.name;
                        renderTaskLists();
                        renderTasks();
                        if (window.innerWidth <= 768) {
                            sidebar.classList.remove('open');
                        }
                    });
                    
                    taskListsContainer.appendChild(listElement);
                });
            }

            function renderTasks() {
                const currentList = taskLists.find(list => list.id === currentListId);
                if (!currentList || currentList.tasks.length === 0) {
                    tasksContainer.innerHTML = `
                        <div class="empty-state">
                            <i class="fas fa-clipboard-list"></i>
                            <p>No tasks found. Add a new task to get started!</p>
                        </div>
                    `;
                    return;
                }

                let tasksToRender = [...currentList.tasks];

                // Apply sorting
                if (sortOrder === 'date') {
                    tasksToRender.sort((a, b) => {
                        if (a.dueDate && b.dueDate) {
                            return new Date(a.dueDate) - new Date(b.dueDate);
                        } else if (a.dueDate) {
                            return -1;
                        } else if (b.dueDate) {
                            return 1;
                        }
                        return 0;
                    });
                } else if (sortOrder === 'priority') {
                    const priorityOrder = { high: 3, medium: 2, low: 1 };
                    tasksToRender.sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]);
                }

                tasksContainer.innerHTML = tasksToRender.map(task => `
                    <div class="task-item" data-id="${task.id}">
                        <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''}>
                        <div class="task-content">
                            <div class="task-title ${task.completed ? 'completed' : ''}">${task.title}</div>
                            <div class="task-details">
                                ${task.dueDate ? `
                                    <div class="task-due-date">
                                        <i class="far fa-calendar-alt"></i>
                                        ${formatDate(task.dueDate)}
                                    </div>
                                ` : ''}
                                ${task.priority !== 'medium' ? `
                                    <div class="task-priority">
                                        <i class="fas fa-${task.priority === 'high' ? 'exclamation-circle' : 'arrow-down'}"></i>
                                        ${task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                        <div class="task-actions">
                            <button class="task-action-btn edit-btn" title="Edit">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="task-action-btn delete-btn" title="Delete">
                                <i class="fas fa-trash-alt"></i>
                            </button>
                        </div>
                    </div>
                `).join('');

                // Add event listeners to the rendered tasks
                document.querySelectorAll('.task-checkbox').forEach(checkbox => {
                    checkbox.addEventListener('change', toggleTaskComplete);
                });

                document.querySelectorAll('.edit-btn').forEach(btn => {
                    btn.addEventListener('click', openEditModal);
                });

                document.querySelectorAll('.delete-btn').forEach(btn => {
                    btn.addEventListener('click', deleteTask);
                });
            }

            function toggleTaskComplete(e) {
                const taskId = e.target.closest('.task-item').dataset.id;
                const currentList = taskLists.find(list => list.id === currentListId);
                if (currentList) {
                    const task = currentList.tasks.find(t => t.id === taskId);
                    if (task) {
                        task.completed = e.target.checked;
                        saveTaskLists();
                        renderTasks();
                        renderTaskLists();
                    }
                }
            }

            function openEditModal(e) {
                const taskId = e.target.closest('.task-item').dataset.id;
                const currentList = taskLists.find(list => list.id === currentListId);
                if (currentList) {
                    const task = currentList.tasks.find(t => t.id === taskId);
                    if (task) {
                        editingTaskId = taskId;
                        modalTitle.textContent = 'Edit Task';
                        document.getElementById('taskId').value = task.id;
                        document.getElementById('editTaskTitle').value = task.title;
                        document.getElementById('editTaskDescription').value = task.description || '';
                        document.getElementById('editTaskDueDate').value = task.dueDate || '';
                        document.getElementById('editTaskPriority').value = task.priority;
                        taskFormModal.classList.add('show');
                    }
                }
            }

            function saveTask() {
                const title = document.getElementById('editTaskTitle').value.trim();
                if (!title) return;

                const currentList = taskLists.find(list => list.id === currentListId);
                if (currentList) {
                    const task = currentList.tasks.find(t => t.id === editingTaskId);
                    if (task) {
                        task.title = title;
                        task.description = document.getElementById('editTaskDescription').value;
                        task.dueDate = document.getElementById('editTaskDueDate').value;
                        task.priority = document.getElementById('editTaskPriority').value;
                        saveTaskLists();
                        renderTasks();
                        renderTaskLists();
                        closeModal();
                    }
                }
            }

            function deleteTask(e) {
                if (confirm('Are you sure you want to delete this task?')) {
                    const taskId = e.target.closest('.task-item').dataset.id;
                    const currentList = taskLists.find(list => list.id === currentListId);
                    if (currentList) {
                        currentList.tasks = currentList.tasks.filter(task => task.id !== taskId);
                        saveTaskLists();
                        renderTasks();
                        renderTaskLists();
                    }
                }
            }

            function createNewList() {
                const listName = document.getElementById('listName').value.trim();
                if (listName) {
                    const newList = {
                        id: Date.now().toString(),
                        name: listName,
                        icon: 'fas fa-list',
                        tasks: []
                    };
                    taskLists.push(newList);
                    saveTaskLists();
                    currentListId = newList.id;
                    currentListTitle.textContent = newList.name;
                    closeListModal();
                    renderTaskLists();
                    renderTasks();
                    document.getElementById('listName').value = '';
                }
            }

            function toggleSortOrder() {
                if (sortOrder === 'default') {
                    sortOrder = 'date';
                    sortTasksBtn.innerHTML = '<i class="far fa-calendar-alt"></i>';
                } else if (sortOrder === 'date') {
                    sortOrder = 'priority';
                    sortTasksBtn.innerHTML = '<i class="fas fa-exclamation-circle"></i>';
                } else {
                    sortOrder = 'default';
                    sortTasksBtn.innerHTML = '<i class="fas fa-sort"></i>';
                }
                renderTasks();
            }

            function closeModal() {
                taskFormModal.classList.remove('show');
                editingTaskId = null;
                taskForm.reset();
            }

            function closeListModal() {
                listFormModal.classList.remove('show');
                listForm.reset();
            }

            function saveTaskLists() {
                localStorage.setItem('taskLists', JSON.stringify(taskLists));
            }

            function toggleTheme() {
                currentTheme = currentTheme === 'light' ? 'dark' : 'light';
                applyTheme(currentTheme);
                localStorage.setItem('theme', currentTheme);
                updateThemeToggleIcon();
            }

            function applyTheme(theme) {
                document.body.className = theme === 'dark' ? 'dark-theme' : '';
                if (theme === 'blue') {
                    // Additional theme customization could be added here
                }
                updateThemeToggleIcon();
            }

            function applyWallpaper(wallpaper) {
                if (wallpaper === 'none') {
                    document.body.style.backgroundImage = 'none';
                    document.body.style.backgroundColor = '';
                } else {
                    const wallpapers = {
                        wallpaper1: 'https://source.unsplash.com/random/1920x1080/?nature,1',
                        wallpaper2: 'https://source.unsplash.com/random/1920x1080/?mountain,1',
                        wallpaper3: 'https://source.unsplash.com/random/1920x1080/?beach,1',
                        wallpaper4: 'https://source.unsplash.com/random/1920x1080/?city,1',
                        wallpaper5: 'https://source.unsplash.com/random/1920x1080/?abstract,1'
                    };
                    document.body.style.backgroundImage = `url(${wallpapers[wallpaper]})`;
                    document.body.style.backgroundColor = 'rgba(0, 0, 0, 0.3)';
                    document.body.style.backgroundBlendMode = 'overlay';
                }
            }

            function updateThemeToggleIcon() {
                themeToggle.innerHTML = currentTheme === 'dark' ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
            }

            function formatDate(dateString) {
                const date = new Date(dateString);
                const today = new Date();
                const tomorrow = new Date(today);
                tomorrow.setDate(today.getDate() + 1);

                if (date.toDateString() === today.toDateString()) {
                    return 'Today';
                } else if (date.toDateString() === tomorrow.toDateString()) {
                    return 'Tomorrow';
                } else {
                    return date.toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric',
                        year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
                    });
                }
            }

            // Responsive sidebar toggle for mobile
            function handleResize() {
                if (window.innerWidth <= 768) {
                    menuToggle.style.display = 'block';
                    sidebar.classList.remove('open');
                } else {
                    menuToggle.style.display = 'none';
                    sidebar.classList.add('open');
                }
            }

            window.addEventListener('resize', handleResize);
            handleResize();
        });
    