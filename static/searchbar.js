document.addEventListener("DOMContentLoaded", () => {
    const searchInput = document.getElementById("search-input");
    const suggestionsList = document.getElementById("suggestions");
    const searchButton = document.getElementById("search-button");
    const backToHomeButton = document.querySelector(".back-to-home-button");

    let cachedSuggestions = [];
    let currentFocus = -1;
  
    // Fetch and cache suggestions on page load
    fetch('/search-suggestions?q=')
      .then(response => response.json())
      .then(suggestions => {
        cachedSuggestions = suggestions;
      })
      .catch(err => {
        console.error("Error fetching initial suggestions:", err);
      });
  
    // Debounce function
    function debounce(func, delay) {
      let timeoutId;
      return function (...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(this, args), delay);
      };
    }
  
    // Filter suggestions based on input
    function filterSuggestions(query) {
      query = query.toLowerCase(); // Ensure case-insensitivity
      return cachedSuggestions.filter(suggestion => {
        const [firstPart] = suggestion.split(" - "); // Split suggestion at the hyphen
        return firstPart.toLowerCase().includes(query); // Match query only with the first part
      });
    }

    // Display suggestions
    function displaySuggestions(suggestions) {
      suggestionsList.innerHTML = "";
      const seenSuggestions = new Set();
      currentFocus = -1;
      
      suggestions.forEach(suggestion => {
        const nameTypeCombo = suggestion.toLowerCase();
        
        if (!seenSuggestions.has(nameTypeCombo)) {
          seenSuggestions.add(nameTypeCombo);
  
          const li = document.createElement("li");
          li.textContent = suggestion;
          li.addEventListener("click", () => {
            searchInput.value = suggestion.split(" - ")[0];
            performSearch(searchInput.value);
          });
          li.addEventListener("mouseover", () => {
            removeActive(suggestionsList.getElementsByTagName("li"));
            li.classList.add("active");
          });
          suggestionsList.appendChild(li);
        }
      });
    }
  
    // Throttled search function
    const throttledSearch = debounce((query) => {
      if (query === "") {
        suggestionsList.innerHTML = "";
        return;
      }
  
      const filteredSuggestions = filterSuggestions(query);
      displaySuggestions(filteredSuggestions);
    }, 100);
  
    function performSearch(query) {
      window.location.href = `/?query=${encodeURIComponent(query)}`;
    }
    
    const urlParams = new URLSearchParams(window.location.search);
    const query = urlParams.get("query"); // Get search query from URL

    // Make "Back to Home" button visible if search was performed
    if (query && backToHomeButton) {
        console.log("Search detected. Showing 'Back to Home' button.");
        backToHomeButton.style.visibility = "visible"; // Show button after search
    }

    function addActive(x) {
      if (!x) return false;
      removeActive(x);
      if (currentFocus >= x.length) currentFocus = 0;
      if (currentFocus < 0) currentFocus = (x.length - 1);
      x[currentFocus].classList.add("active");
      // Auto-scroll
      x[currentFocus].scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'start'
      });
    }
  
    function removeActive(x) {
      for (let i = 0; i < x.length; i++) {
        x[i].classList.remove("active");
      }
    }
  
    searchInput.addEventListener("input", function() {
      const query = searchInput.value.trim();
      throttledSearch(query);
    });
  
    searchInput.addEventListener("keydown", function(event) {
      const x = suggestionsList.getElementsByTagName("li");
      if (event.key === "ArrowDown") {
        currentFocus++;
        addActive(x);
      } else if (event.key === "ArrowUp") {
        currentFocus--;
        addActive(x);
      } else if (event.key === "Enter") {  
      
        event.preventDefault();
        if (currentFocus > -1) {
          if (x) x[currentFocus].click();
        } else {
          performSearch(searchInput.value.trim());
        }
      }
    });
  
    searchButton.addEventListener("click", function() {
      performSearch(searchInput.value.trim());
      if (backToHomeButton) {
        console.log("Back to Home button found. Making it visible.");
        backToHomeButton.style.visibility = "visible"; // Ensure visibility
      } else {
          console.warn("Back to Home button not found in the document.");
      }
    });

    document.addEventListener("click", function(event) {
      if (!searchInput.contains(event.target) && !suggestionsList.contains(event.target)) {
        suggestionsList.innerHTML = "";
      }
    });

    document.addEventListener("keydown", function (event) {
      // Check if Ctrl (or Cmd on Mac) + / is pressed
      if ((event.ctrlKey || event.metaKey) && event.key === "/") {
          event.preventDefault(); // Prevent default behavior (e.g., opening browser search)
          document.getElementById("search-input").focus();
      }
  });

  });