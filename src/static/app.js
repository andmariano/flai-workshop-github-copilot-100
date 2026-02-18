document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Clear existing options in dropdown, keeping only the placeholder
      const placeholder = activitySelect.querySelector('option[value=""]');
      activitySelect.innerHTML = "";
      if (placeholder) {
        activitySelect.appendChild(placeholder);
      }

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;
        
        // Create participants list using DOM APIs to prevent XSS
        let participantsSection;
        if (details.participants.length > 0) {
          participantsSection = document.createElement('div');
          participantsSection.className = 'participants-section';
          
          const participantsLabel = document.createElement('strong');
          participantsLabel.textContent = `Participants (${details.participants.length}):`;
          participantsSection.appendChild(participantsLabel);
          
          const participantsList = document.createElement('ul');
          participantsList.className = 'participants-list';
          
          details.participants.forEach(email => {
            const listItem = document.createElement('li');
            
            const emailSpan = document.createElement('span');
            emailSpan.className = 'participant-email';
            emailSpan.textContent = email;
            listItem.appendChild(emailSpan);
            
            const deleteButton = document.createElement('button');
            deleteButton.className = 'delete-btn';
            deleteButton.dataset.activity = name;
            deleteButton.dataset.email = email;
            deleteButton.title = 'Remove participant';
            deleteButton.innerHTML = `
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                <line x1="10" y1="11" x2="10" y2="17"></line>
                <line x1="14" y1="11" x2="14" y2="17"></line>
              </svg>
            `;
            listItem.appendChild(deleteButton);
            
            participantsList.appendChild(listItem);
          });
          
          participantsSection.appendChild(participantsList);
        } else {
          participantsSection = document.createElement('div');
          participantsSection.className = 'participants-section';
          
          const participantsLabel = document.createElement('strong');
          participantsLabel.textContent = 'Participants:';
          participantsSection.appendChild(participantsLabel);
          
          const noParticipantsMsg = document.createElement('p');
          noParticipantsMsg.className = 'no-participants';
          noParticipantsMsg.textContent = 'No participants yet. Be the first to sign up!';
          participantsSection.appendChild(noParticipantsMsg);
        }

        // Build activity card content using DOM APIs
        const heading = document.createElement('h4');
        heading.textContent = name;
        activityCard.appendChild(heading);
        
        const description = document.createElement('p');
        description.textContent = details.description;
        activityCard.appendChild(description);
        
        const schedule = document.createElement('p');
        const scheduleLabel = document.createElement('strong');
        scheduleLabel.textContent = 'Schedule: ';
        schedule.appendChild(scheduleLabel);
        schedule.appendChild(document.createTextNode(details.schedule));
        activityCard.appendChild(schedule);
        
        const availability = document.createElement('p');
        const availabilityLabel = document.createElement('strong');
        availabilityLabel.textContent = 'Availability: ';
        availability.appendChild(availabilityLabel);
        availability.appendChild(document.createTextNode(`${spotsLeft} spots left`));
        activityCard.appendChild(availability);
        
        activityCard.appendChild(participantsSection);

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });

      // Add event listeners for delete buttons
      document.querySelectorAll('.delete-btn').forEach(button => {
        button.addEventListener('click', handleDeleteParticipant);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle participant deletion
  async function handleDeleteParticipant(event) {
    const button = event.currentTarget;
    const activity = button.dataset.activity;
    const email = button.dataset.email;

    if (!confirm(`Are you sure you want to remove ${email} from ${activity}?`)) {
      return;
    }

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/unregister?email=${encodeURIComponent(email)}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        messageDiv.classList.remove("hidden");
        
        // Refresh activities list
        await fetchActivities();

        // Hide message after 5 seconds
        setTimeout(() => {
          messageDiv.classList.add("hidden");
        }, 5000);
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
        messageDiv.classList.remove("hidden");
      }
    } catch (error) {
      messageDiv.textContent = "Failed to remove participant. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error removing participant:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        
        // Refresh activities list to show the new participant
        await fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
