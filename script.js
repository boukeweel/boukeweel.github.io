import { PROJECTS_MASTER_LIST, TAG_DEFINITIONS } from './projects.js';

// Get references to modal elements
const projectModal = document.getElementById('projectModal');
const closeModalBtn = document.getElementById('closeModalBtn');
const modalProjectTitle = document.getElementById('modalProjectTitle');
const modalProjectLongDescription = document.getElementById('modalProjectLongDescription');
const modalLinks = document.getElementById('modalLinks');
const prevImageBtn = document.getElementById('prevImageBtn');
const nextImageBtn = document.getElementById('nextImageBtn');
const modalCarouselTrack = document.getElementById('modalCarouselTrack');
const carouselDotsContainer = document.getElementById('carouselDotsContainer');
const modalProjectTags = document.getElementById('modalProjectTags'); // Reference to modal tags container

// References to project containers
const highlightedProjectsContainer = document.getElementById('highlighted-projects-container');
const allProjectsGrid = document.getElementById('all-projects-grid'); // NEW: Single grid for all projects

// References to filter elements
const filterBar = document.querySelector('.filter-bar');

// Carousel state variables
let currentProjectImages = [];
let currentImageIndex = 0;
let carouselInterval;
const carouselCycleTime = 5000; // 5 seconds

// Helper function to determine contrasting text color based on background hex color
function getContrastTextColor(hexcolor) {
  const hex = hexcolor.startsWith('#') ? hexcolor.slice(1) : hexcolor;
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  // Calculate luminance (perceived brightness)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? '#333' : 'white'; // Use dark text for light bg, white for dark bg
}

// Function to update the displayed image in the carousel with a slide effect
function displayCurrentImage() {
  if (currentProjectImages.length > 0) {
    modalCarouselTrack.style.transform = `translateX(-${currentImageIndex * 100}%)`;
    updateCarouselDots(); // Update dot active state
  }
}

// Function to go to the next image
function nextImage() {
  if (currentProjectImages.length === 0) return;
  currentImageIndex = (currentImageIndex + 1) % currentProjectImages.length;
  displayCurrentImage();
  resetCarouselInterval(); // Reset interval on manual interaction
}

// Function to go to the previous image
function prevImage() {
  if (currentProjectImages.length === 0) return;
  currentImageIndex = (currentImageIndex - 1 + currentProjectImages.length) % currentProjectImages.length;
  displayCurrentImage();
  resetCarouselInterval(); // Reset interval on manual interaction
}

// Function to start the automatic carousel cycling
function startCarouselInterval() {
  clearInterval(carouselInterval);
  if (currentProjectImages.length > 1) { // Only cycle if there's more than one image
    carouselInterval = setInterval(nextImage, carouselCycleTime);
  }
}

// Function to reset (clear and restart) the carousel interval
function resetCarouselInterval() {
  clearInterval(carouselInterval);
  startCarouselInterval();
}

// Function to create and update carousel dots
function createCarouselDots() {
  carouselDotsContainer.innerHTML = ''; // Clear existing dots
  if (currentProjectImages.length > 1) { // Only show dots if more than one image
    for (let i = 0; i < currentProjectImages.length; i++) {
      const dot = document.createElement('span');
      dot.classList.add('dot');
      dot.dataset.index = i; // Store index for click handling
      dot.addEventListener('click', () => {
        currentImageIndex = i;
        displayCurrentImage();
        resetCarouselInterval();
      });
      carouselDotsContainer.appendChild(dot);
    }
  }
  updateCarouselDots(); // Set initial active dot
}

// Function to update the active state of dots
function updateCarouselDots() {
  const dots = carouselDotsContainer.querySelectorAll('.dot');
  dots.forEach((dot, index) => {
    if (index === currentImageIndex) {
      dot.classList.add('active');
    } else {
      dot.classList.remove('active');
    }
  });
}

// Function to create and display tags (used for both cards and modal)
function renderTags(containerElement, tags, isModal = false) {
  containerElement.innerHTML = ''; // Clear existing tags
  if (tags && tags.length > 0) {
    tags.forEach(tagName => { // Iterate through tag names
      const tagSpan = document.createElement('span');
      tagSpan.classList.add(isModal ? 'modal-project-tag' : 'project-tag-card');
      tagSpan.textContent = tagName; // Use the tag name directly

      // Look up the color from TAG_DEFINITIONS, or use default
      const tagColor = TAG_DEFINITIONS[tagName] || '#e0e0e0'; // Use default if not found
      tagSpan.style.backgroundColor = tagColor;
      tagSpan.style.color = getContrastTextColor(tagColor); // Set contrasting text color
      containerElement.appendChild(tagSpan);
    });
    containerElement.style.display = 'flex'; // Show the tags container
  } else {
    containerElement.style.display = 'none'; // Hide if no tags
  }
}

/* =========================
   LINKS: array-only logic
   ========================= */

// Render links into the modal container from project.links = [{ label, href }]
function renderLinks(container, project) {
  container.innerHTML = '';

  const links = Array.isArray(project.links)
    ? project.links.filter(l => l && l.href && l.label)
    : [];

  if (links.length === 0) {
    container.style.display = 'none';
    return;
  }

  container.style.display = 'flex';
  links.forEach(({ label, href }) => {
    const a = document.createElement('a');
    a.className = 'modal-link-button';
    a.href = href;
    a.textContent = label;
    a.target = '_blank';
    a.rel = 'noopener';
    container.appendChild(a);
  });
}

// Function to create a single project card DOM element
function createProjectCardElement(projectData) {
  const card = document.createElement('div');
  card.classList.add('project-card');
  card.dataset.project = JSON.stringify(projectData); // Store full data for modal

  card.innerHTML = `
    <img src="${projectData.cardImage || 'https://placehold.co/600x400/cccccc/333333?text=No+Image'}" alt="Project ${projectData.title} Preview">
    <div class="project-card-content">
      <h3>${projectData.title}</h3>
      <div class="project-tags-card" data-card-tags></div>
      <p>${projectData.description || ''}</p>
    </div>
  `;

  // Add error handler for image
  const imgElement = card.querySelector('img');
  imgElement.onerror = function() {
    this.onerror = null;
    this.src = 'https://placehold.co/600x400/cccccc/333333?text=Image+Not+Found';
    this.alt = 'Image failed to load.';
  };

  // Render tags on the newly created card
  const cardTagsContainer = card.querySelector('[data-card-tags]');
  if (cardTagsContainer) {
    renderTags(cardTagsContainer, projectData.tags, false);
  }

  // Attach click listener for modal
  card.addEventListener('click', () => openProjectModal(projectData));

  return card;
}

// Function to render projects into a specific container
function renderProjectsIntoContainer(containerElement, projectsToRender) {
  containerElement.innerHTML = ''; // Clear existing content
  projectsToRender.forEach(project => {
    containerElement.appendChild(createProjectCardElement(project));
  });
}

// Function to open the modal and populate with project data
function openProjectModal(projectData) {
  modalProjectTitle.textContent = projectData.title;

  // Keep your original longDescription behavior: use innerHTML (no CSS changes here)
  modalProjectLongDescription.innerHTML = projectData.longDescription;

  // Clear previous images from the track
  modalCarouselTrack.innerHTML = '';

  // Update carousel images and create image elements
  currentProjectImages = projectData.images || [];
  currentImageIndex = 0; // Start from the first image

  currentProjectImages.forEach(imageUrl => {
    const img = document.createElement('img');
    img.classList.add('carousel-image');
    img.src = imageUrl;
    img.alt = `Project Image for ${projectData.title}`; // More descriptive alt text
    // Add an error handler for images that might not load
    img.onerror = function() {
      this.onerror = null; // Prevent infinite loop if fallback also fails
      this.src = 'https://placehold.co/600x400/cccccc/333333?text=Image+Not+Found'; // Fallback image
      this.alt = 'Image failed to load.';
    };
    modalCarouselTrack.appendChild(img);
  });

  // Set initial position of the track
  displayCurrentImage();
  createCarouselDots(); // Create dots for the current project
  renderTags(modalProjectTags, projectData.tags, true); // Display tags in the modal

  // Show/hide arrows and dots based on number of images
  if (currentProjectImages.length > 1) {
    prevImageBtn.style.display = 'block';
    nextImageBtn.style.display = 'block';
    carouselDotsContainer.style.display = 'flex'; // Show dots container
    startCarouselInterval(); // Start auto-cycling
  } else {
    prevImageBtn.style.display = 'none';
    nextImageBtn.style.display = 'none';
    carouselDotsContainer.style.display = 'none'; // Hide dots container
    clearInterval(carouselInterval); // Ensure interval is cleared if only one image
  }

  // Render ONLY the new links array (no legacy fields)
  renderLinks(modalLinks, projectData);

  projectModal.classList.add('active'); // Show the modal
  document.body.style.overflow = 'hidden'; // Prevent scrolling of the background
}

// Function to close the modal
function closeProjectModal() {
  projectModal.classList.remove('active'); // Hide the modal
  document.body.style.overflow = ''; // Restore background scrolling
  clearInterval(carouselInterval); // Stop auto-cycling when modal closes
  currentProjectImages = []; // Clear images data
  currentImageIndex = 0; // Reset index
  modalCarouselTrack.innerHTML = ''; // Clear images from the DOM
  modalCarouselTrack.style.transform = 'translateX(0)'; // Reset track position
  carouselDotsContainer.innerHTML = ''; // Clear dots from the DOM
  modalProjectTags.innerHTML = ''; // Clear tags from the modal
  modalLinks.innerHTML = ''; // Clear links from the modal
  modalLinks.style.display = 'none';
}

// Function to initialize filter buttons for All Projects section
function initializeAllProjectsSection() {
  const uniqueTags = new Set();
  // Collect tags from all projects that belong to the 'all' section
  PROJECTS_MASTER_LIST.forEach(project => {
    // If sections is undefined or empty, default to 'all'
    const isInAllSection = project.sections?.includes('all') || !project.sections || project.sections.length === 0;
    if (isInAllSection && project.tags) {
      project.tags.forEach(tag => uniqueTags.add(tag));
    }
  });

  // Clear existing buttons (only "Show All" should be there initially)
  filterBar.innerHTML = '<button class="filter-button active" data-filter="all">Show All</button>';

  // Create buttons for each unique tag
  Array.from(uniqueTags).sort().forEach(tag => {
    const button = document.createElement('button');
    button.classList.add('filter-button');
    button.dataset.filter = tag;
    button.textContent = tag;
    filterBar.appendChild(button);
  });

  // Add event listeners to all filter buttons
  filterBar.querySelectorAll('.filter-button').forEach(button => {
    button.addEventListener('click', () => {
      renderAllProjectsFiltered(button.dataset.filter);
    });
  });

  // Apply initial filter (show all)
  renderAllProjectsFiltered('all');
}

// Function to render filtered projects into the single All Projects grid
function renderAllProjectsFiltered(selectedTag) {
  // Update active state of filter buttons
  filterBar.querySelectorAll('.filter-button').forEach(button => {
    if (button.dataset.filter === selectedTag) {
      button.classList.add('active');
    } else {
      button.classList.remove('active');
    }
  });

  // Clear the single All Projects grid
  allProjectsGrid.innerHTML = '';

  // Filter projects for the 'all' section and the selected tag
  const filteredProjects = PROJECTS_MASTER_LIST.filter(project => {
    const isInAllSection = project.sections?.includes('all') || !project.sections || project.sections.length === 0;
    const matchesFilter = selectedTag === 'all' || project.tags?.includes(selectedTag);
    return isInAllSection && matchesFilter;
  });

  // Render the filtered projects into the single All Projects grid
  renderProjectsIntoContainer(allProjectsGrid, filteredProjects);
}

// Main initialization function for the portfolio
function initializePortfolio() {
  // Render Highlighted Projects
  const highlightedProjects = PROJECTS_MASTER_LIST.filter(project =>
    project.sections?.includes('highlighted')
  );
  renderProjectsIntoContainer(highlightedProjectsContainer, highlightedProjects);

  // Initialize All Projects section with filters and content
  initializeAllProjectsSection();
}

// Call the main initialization function when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', initializePortfolio);

// Add event listener to close button (modal)
closeModalBtn.addEventListener('click', closeProjectModal);

// Add event listeners for carousel arrows
prevImageBtn.addEventListener('click', prevImage);
nextImageBtn.addEventListener('click', nextImage);

// Close modal when clicking outside the content
projectModal.addEventListener('click', (event) => {
  if (event.target === projectModal) {
    closeProjectModal();
  }
});
