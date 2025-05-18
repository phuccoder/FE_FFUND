import { useState, useEffect } from 'react';
import { Badge, Tooltip } from 'antd';
import { AlertCircle, FileText, ChevronDown, ChevronUp, Filter } from 'lucide-react';
import React from 'react';

const ViolationsTable = ({ violations = [] }) => {
  const [sortField, setSortField] = useState('violate_time');
  const [sortDirection, setSortDirection] = useState('asc');
  const [expandedRow, setExpandedRow] = useState(null);
  const [filteredViolations, setFilteredViolations] = useState(violations);
  const [typeFilter, setTypeFilter] = useState('ALL');

  useEffect(() => {
    if (typeFilter === 'ALL') {
      setFilteredViolations(violations);
    } else {
      setFilteredViolations(violations.filter(v => v.type === typeFilter));
    }
  }, [violations, typeFilter]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedViolations = [...filteredViolations].sort((a, b) => {
    if (sortField === 'violate_time') {
      return sortDirection === 'asc' ? a.violate_time - b.violate_time : b.violate_time - a.violate_time;
    }
    if (sortField === 'type') {
      return sortDirection === 'asc' 
        ? a.type.localeCompare(b.type) 
        : b.type.localeCompare(a.type);
    }
    return 0;
  });

  const violationTypes = [
    'ALL',
    ...Array.from(new Set(violations.map(v => v.type)))
  ];

  const getViolationTypeColor = (type) => {
    const typeColors = {
      'COPYRIGHT_INFRINGEMENT': 'bg-orange-100 text-orange-800',
      'REWARD_NON_DELIVERY': 'bg-red-100 text-red-800',
      'REWARD_DELAY': 'bg-yellow-100 text-yellow-800',
      'MONEY_LAUNDERING': 'bg-purple-100 text-purple-800'
    };
    return typeColors[type] || 'bg-gray-100 text-gray-800';
  };

  const formatViolationType = (type) => {
    return type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-2">Project Violations</h2>
      <div className="mb-6 text-sm text-gray-600 flex items-center">
        <AlertCircle className="w-4 h-4 mr-2" />
        <span>Showing {filteredViolations.length} violations for project <span className="font-medium">{violations[0]?.projectTitle || 'Unknown'}</span></span>
      </div>

      {/* Filter Section */}
      <div className="mb-4 flex items-center">
        <Filter className="w-4 h-4 mr-2 text-gray-500" />
        <span className="text-sm font-medium mr-2">Filter by type:</span>
        <div className="flex flex-wrap gap-2">
          {violationTypes.map((type) => (
            <button
              key={type}
              onClick={() => setTypeFilter(type)}
              className={`px-3 py-1 text-xs rounded-full transition-colors ${
                typeFilter === type 
                  ? 'bg-blue-100 text-blue-800 border border-blue-300' 
                  : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
              }`}
            >
              {type === 'ALL' ? 'All Types' : formatViolationType(type)}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse">
          <thead>
            <tr className="bg-gray-50">
              <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                <button 
                  className="flex items-center focus:outline-none"
                  onClick={() => handleSort('violate_time')}
                >
                  Violation #
                  {sortField === 'violate_time' && (
                    sortDirection === 'asc' ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />
                  )}
                </button>
              </th>
              <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                <button 
                  className="flex items-center focus:outline-none"
                  onClick={() => handleSort('type')}
                >
                  Type
                  {sortField === 'type' && (
                    sortDirection === 'asc' ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />
                  )}
                </button>
              </th>
              <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Manager</th>
              <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Status</th>
              <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedViolations.length > 0 ? (
              sortedViolations.map((violation) => (
                <React.Fragment key={violation.id}>
                  <tr className={`hover:bg-gray-50 ${expandedRow === violation.id ? 'bg-blue-50' : ''}`}>
                    <td className="py-4 px-4">
                      <div className="text-sm font-medium text-gray-900">#{violation.violate_time}</div>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getViolationTypeColor(violation.type)}`}>
                        {formatViolationType(violation.type)}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="text-sm text-gray-900">{violation.managerName}</div>
                      <div className="text-xs text-gray-500">ID: {violation.managerId}</div>
                    </td>
                    <td className="py-4 px-4">
                      <Badge 
                        status={violation.active ? "processing" : "default"} 
                        text={violation.active ? "Active" : "Resolved"} 
                      />
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-500">
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => setExpandedRow(expandedRow === violation.id ? null : violation.id)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          {expandedRow === violation.id ? 'Hide details' : 'View details'}
                        </button>
                        <a 
                          href={violation.evidenceFile} 
                          target="_blank" 
                          rel="noreferrer"
                          className="flex items-center text-gray-600 hover:text-gray-800"
                        >
                          <FileText className="w-4 h-4 mr-1" />
                          Evidence
                        </a>
                      </div>
                    </td>
                  </tr>
                  {expandedRow === violation.id && (
                    <tr>
                      <td colSpan={5} className="p-4 bg-blue-50">
                        <div className="text-sm">
                          <div className="font-medium mb-2">Description:</div>
                          <div className="p-3 bg-white rounded border border-gray-200">
                            {violation.description || "No description provided."}
                          </div>
                          <div className="mt-3">
                            <a 
                              href={violation.evidenceFile}
                              target="_blank"
                              rel="noreferrer" 
                              className="text-blue-600 hover:text-blue-800 flex items-center"
                            >
                              <FileText className="w-4 h-4 mr-2" />
                              View Evidence Document
                            </a>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="py-4 px-4 text-center text-gray-500">
                  No violations found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ViolationsTable;