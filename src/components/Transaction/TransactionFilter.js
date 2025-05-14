import React, { useState } from 'react';
import { Form, Button } from 'react-bootstrap';

export default function TransactionFilter({ onFilterChange, projects = [], projectMapping = {} }) {
  const [status, setStatus] = useState('');
  const [project, setProject] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    // Get the project ID from the mapping if a project is selected
    const projectId = project ? projectMapping[project] : null;
    onFilterChange({ status, project, projectId });
  };

  const handleReset = () => {
    setStatus('');
    setProject('');
    onFilterChange({ status: '', project: '', projectId: null });
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-md mb-4">
      <h3 className="text-lg font-semibold mb-3">Filter Investment</h3>

      <Form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Form.Group controlId="statusFilter">
            <Form.Label>Status</Form.Label>
            <Form.Select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="">All Statuses</option>
              <option value="PAID">Paid</option>
              <option value="PENDING">Pending</option>
              <option value="CANCEL">Cancelled</option>
            </Form.Select>
          </Form.Group>

          <Form.Group controlId="projectFilter">
            <Form.Label>Project</Form.Label>
            <Form.Select
              value={project}
              onChange={(e) => setProject(e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="">All Projects</option>
              {projects.map((projectName, index) => (
                <option key={index} value={projectName}>
                  {projectName}
                </option>
              ))}
            </Form.Select>
          </Form.Group>

          <div className="flex items-end space-x-2">
            <Button variant="primary" type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
              Apply Filters
            </Button>
            <Button variant="outline-secondary" onClick={handleReset} className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200">
              Reset
            </Button>
          </div>
        </div>
      </Form>
    </div>
  );
}