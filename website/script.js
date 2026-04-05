document.addEventListener('DOMContentLoaded', () => {
    // Theme Toggle Functionality
    const themeToggleBtn = document.getElementById('theme-toggle');
    const body = document.body;
    const themeIcon = themeToggleBtn.querySelector('i');

    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        body.setAttribute('data-theme', 'dark');
        themeIcon.classList.replace('fa-moon', 'fa-sun');
    }

    themeToggleBtn.addEventListener('click', () => {
        if (body.hasAttribute('data-theme')) {
            body.removeAttribute('data-theme');
            localStorage.setItem('theme', 'light');
            themeIcon.classList.replace('fa-sun', 'fa-moon');
        } else {
            body.setAttribute('data-theme', 'dark');
            localStorage.setItem('theme', 'dark');
            themeIcon.classList.replace('fa-moon', 'fa-sun');
        }
    });

    // Form Elements
    const issueForm = document.getElementById('issue-form');
    const aiResponsePanel = document.getElementById('ai-response-panel');
    const loadingState = document.getElementById('loading-state');
    const resultState = document.getElementById('result-state');
    const resetBtn = document.getElementById('reset-form');
    const aiFeed = document.getElementById('ai-feed');

    // Handle Form Submission
    issueForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const category = document.getElementById('category').value;
        const description = document.getElementById('description').value;

        if (!category || !description.trim()) return;

        // UI Transitions
        aiResponsePanel.classList.remove('hidden');
        loadingState.classList.remove('hidden');
        resultState.classList.add('hidden');
        issueForm.parentElement.style.opacity = '0.5';
        issueForm.parentElement.style.pointerEvents = 'none';

        // Integrate with existing app.py Flask API
        fetch('http://127.0.0.1:5000/analyze', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ query: description, category: category })
        })
        .then(res => {
            if (!res.ok) {
                throw new Error('Server error: ' + res.status);
            }
            return res.json();
        })
        .then(data => {
            if (data.status !== 'success') {
                throw new Error(data.message || 'Unknown error from server');
            }

            // Populate Results directly from Backend
            const riskBadge = document.getElementById('result-risk');
            riskBadge.textContent = `${data.risk_level} Risk`;
            
            const riskClassMap = {
                'High': 'high',
                'Medium': 'medium',
                'Low': 'low'
            };
            const riskClass = riskClassMap[data.risk_level] || 'low';
            riskBadge.className = `badge ${riskClass}`;

            const actionList = document.getElementById('result-actions');
            actionList.innerHTML = '';
            data.suggestions.forEach(action => {
                const li = document.createElement('li');
                li.textContent = action;
                actionList.appendChild(li);
            });

            document.getElementById('result-recommendation').textContent = data.analysis;

            // Switch presentation states
            loadingState.classList.add('hidden');
            resultState.classList.remove('hidden');

            // Show confirmation toast
            showToast('AI analysis complete');

            // Add the new report to the Dashboard feed dynamically
            addToDashboardFeed(category, riskClass, data.risk_level);

            // Scroll to view the response
            aiResponsePanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        })
        .catch(err => {
            console.error('Error fetching from backend:', err);
            
            // Revert state loading animations
            loadingState.classList.add('hidden');
            
            // Show error state gracefully using the target result card
            resultState.classList.remove('hidden');
            
            const riskBadge = document.getElementById('result-risk');
            riskBadge.className = 'badge high';
            riskBadge.textContent = 'Server Error';
            
            const actionList = document.getElementById('result-actions');
            actionList.innerHTML = '<li>⚠️ Failed to connect to backend server.</li>';
            
            document.getElementById('result-recommendation').textContent = 'Please make sure that the Flask app (app.py) is running locally on port 5000.';
            
            aiResponsePanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        });
    });

    // Reset Form for another report
    resetBtn.addEventListener('click', () => {
        aiResponsePanel.classList.add('hidden');
        issueForm.reset();
        issueForm.parentElement.style.opacity = '1';
        issueForm.parentElement.style.pointerEvents = 'auto';
        issueForm.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });

    // Toast Notification utility
    function showToast(message) {
        const toast = document.getElementById('toast');
        document.getElementById('toast-message').textContent = message;
        toast.classList.remove('hidden');
        setTimeout(() => { toast.classList.add('hidden'); }, 3000);
    }

    // Update Dashboard dynamically referencing the real processed data
    function addToDashboardFeed(category, riskClass, riskLevelText) {
        const categoryMap = {
            waste: { icon: 'fa-recycle', color: 'success', title: 'New Waste Report Analyzed' },
            traffic: { icon: 'fa-car-burst', color: 'warning', title: 'Traffic Incident Processed' },
            environment: { icon: 'fa-smog', color: 'danger', title: 'Environmental Hazard Logged' },
            safety: { icon: 'fa-shield-halved', color: 'info', title: 'Safety Report Evaluated' }
        };

        const details = categoryMap[category] || categoryMap['waste'];
        
        const li = document.createElement('li');
        li.className = 'suggestion-item slide-in';
        li.innerHTML = `
            <div class="icon-box ${details.color}"><i class="fa-solid ${details.icon}"></i></div>
            <div class="suggestion-content">
                <h4>${details.title}</h4>
                <p>Backend processed new report and assigned an action plan.</p>
            </div>
            <span class="badge ${riskClass}">${riskLevelText} Risk</span>
        `;

        if (aiFeed) {
            aiFeed.insertBefore(li, aiFeed.firstChild);
            if (aiFeed.children.length > 4) {
                aiFeed.removeChild(aiFeed.lastChild);
            }
        }
    }

    // Dashboard Domain Tabs interactivity
    const tabs = document.querySelectorAll('.tab-btn');
    if (tabs.length > 0) {
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                
                const dashboardGrid = document.querySelector('.dashboard-grid');
                if (dashboardGrid) {
                    dashboardGrid.style.opacity = '0.5';
                    dashboardGrid.style.transform = 'scale(0.98)';
                    setTimeout(() => {
                        dashboardGrid.style.transition = 'all 0.3s ease';
                        dashboardGrid.style.opacity = '1';
                        dashboardGrid.style.transform = 'scale(1)';
                    }, 300);
                }
            });
        });
    }

    // Setup animated intersections (Fade Up on Scroll)
    const observerOptions = { root: null, rootMargin: '0px', threshold: 0.1 };
    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.animationPlayState = 'running';
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    document.querySelectorAll('.animate-up, .slide-in').forEach(el => {
        if (el.getBoundingClientRect().top > window.innerHeight) {
            el.style.animationPlayState = 'paused';
            observer.observe(el);
        }
    });
});
