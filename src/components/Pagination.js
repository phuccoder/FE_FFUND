import React from 'react';

export default function Pagination({ currentPage, totalPages, onPageChange }) {
  // Generate page numbers
  const getPageNumbers = () => {
    const pages = [];
    const maxPagesToShow = 5;
    
    if (totalPages <= maxPagesToShow) {
      // Show all pages if total pages are less than max to show
      for (let i = 0; i < totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(0);
      
      // Calculate start and end of middle pages
      let start = Math.max(1, currentPage - 1);
      let end = Math.min(start + 2, totalPages - 1);
      
      // Adjust if we're near the end
      if (end === totalPages - 1) {
        start = Math.max(1, end - 2);
      }
      
      // Add ellipsis after first page if needed
      if (start > 1) {
        pages.push('...');
      }
      
      // Add middle pages
      for (let i = start; i < end; i++) {
        pages.push(i);
      }
      
      // Add ellipsis before last page if needed
      if (end < totalPages - 1) {
        pages.push('...');
      }
      
      // Always show last page
      pages.push(totalPages - 1);
    }
    
    return pages;
  };

  const pages = getPageNumbers();

  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center mt-4">
      <nav className="inline-flex rounded-md shadow-sm">
        <button
          onClick={() => onPageChange(Math.max(0, currentPage - 1))}
          disabled={currentPage === 0}
          className={`relative inline-flex items-center px-2 py-2 rounded-l-md border ${
            currentPage === 0
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-white text-gray-500 hover:bg-gray-50'
          } text-sm font-medium`}
        >
          Previous
        </button>
        
        {pages.map((page, index) => (
          page === '...' ? (
            <span key={`ellipsis-${index}`} className="relative inline-flex items-center px-4 py-2 border bg-white text-sm font-medium text-gray-700">
              ...
            </span>
          ) : (
            <button
              key={`page-${page}`}
              onClick={() => onPageChange(page)}
              className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                currentPage === page
                  ? 'z-10 bg-blue-600 text-white'
                  : 'bg-white text-gray-500 hover:bg-gray-50'
              }`}
            >
              {page + 1}
            </button>
          )
        ))}
        
        <button
          onClick={() => onPageChange(Math.min(totalPages - 1, currentPage + 1))}
          disabled={currentPage === totalPages - 1}
          className={`relative inline-flex items-center px-2 py-2 rounded-r-md border ${
            currentPage === totalPages - 1
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-white text-gray-500 hover:bg-gray-50'
          } text-sm font-medium`}
        >
          Next
        </button>
      </nav>
    </div>
  );
}