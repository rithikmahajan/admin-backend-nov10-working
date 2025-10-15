// Import required dependencies
const express = require("express"); // Express framework for routing
const router = express.Router(); // Initialize an Express router instance
const filterController = require("../controllers/filter/FilterController"); // Controller for filter-related logic

// Define filter-related API endpoints
router
  // POST /api/filters/
  // Creates a new filter (e.g., for product attributes like size, color, or price range)
  .post("/", filterController.createFilter)

  // POST /api/filters/apply
  // Applies filter criteria to search/filter products
  .post("/apply", filterController.applyFilters)

  // GET /api/filters/
  // Retrieves all filters
  .get("/", filterController.getAllFilters)

  // GET /api/filters/key/:key
  // Gets a specific filter by key name (e.g., color, size, brand)
  .get("/key/:key", filterController.getFiltersByKey)

  // GET /api/filters/price-range
  // Gets available price range for products
  .get("/price-range", filterController.getPriceRange)

  // GET /api/filters/sizes
  // Gets available sizes
  .get("/sizes", filterController.getAvailableSizes)

  // GET /api/filters/colors
  // Gets available colors
  .get("/colors", filterController.getAvailableColors)

  // GET /api/filters/brands
  // Gets available brands
  .get("/brands", filterController.getBrands)

  // GET /api/filters/:id
  // Retrieves a specific filter by its ID
  .get("/:id", filterController.getFilterById)

  // PUT /api/filters/:id
  // Updates a specific filter by its ID
  .put("/:id", filterController.updateFilter)

  // DELETE /api/filters/:id
  // Deletes a specific filter by its ID
  .delete("/:id", filterController.deleteFilter)

  // GET /api/filters/public/active
  // Gets all active filters for frontend use (no authentication required)
  .get("/public/active", filterController.getPublicActiveFilters)

  // GET /api/filters/public/price-settings
  // Gets price settings and range for frontend (no authentication required)
  .get("/public/price-settings", filterController.getPublicPriceSettings);

// Export the router for use in the main Express app
module.exports = router;