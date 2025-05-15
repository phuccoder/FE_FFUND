import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { evaluationService } from 'src/services/evaluationService';
import { globalSettingService } from 'src/services/globalSettingService';

const ProjectEvaluationPoint = ({ projectId }) => {
  const [allEvaluations, setAllEvaluations] = useState([]);
  const [latestEvaluations, setLatestEvaluations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalScore, setTotalScore] = useState({ actual: 0, maximum: 0 });
  const [latestTotalScore, setLatestTotalScore] = useState({ actual: 0, maximum: 0 });
  const [isLatestExpanded, setIsLatestExpanded] = useState(false); 
  const [isHistoryExpanded, setIsHistoryExpanded] = useState(false);
  const [versionGroups, setVersionGroups] = useState({});
  const [latestVersion, setLatestVersion] = useState(0);
  const [previousVersion, setPreviousVersion] = useState(0);
  
  // Global settings thresholds
  const [thresholds, setThresholds] = useState({
    excellent: 0.90, 
    pass: 0.70,      
    resubmit: 0.30   
  });
  const [loadingThresholds, setLoadingThresholds] = useState(true);

  // Fetch global settings for evaluation thresholds
  useEffect(() => {
    const fetchThresholds = async () => {
      setLoadingThresholds(true);
      try {
        const response = await globalSettingService.getGlobalSettingByType('');
        
        if (response && response.data && Array.isArray(response.data)) {
          const settings = response.data;

          const passExcellentSetting = settings.find(s => s.type === 'PASS_EXCELLENT_PERCENTAGE');
          const passSetting = settings.find(s => s.type === 'PASS_PERCENTAGE');
          const resubmitSetting = settings.find(s => s.type === 'RESUBMIT_PERCENTAGE');
          
          const newThresholds = { ...thresholds };
          
          if (passExcellentSetting) {
            newThresholds.excellent = parseFloat(passExcellentSetting.value);
          }
          
          if (passSetting) {
            newThresholds.pass = parseFloat(passSetting.value);
          }
          
          if (resubmitSetting) {
            newThresholds.resubmit = parseFloat(resubmitSetting.value);
          }
          
          setThresholds(newThresholds);
          console.log('Evaluation thresholds loaded:', newThresholds);
        }
      } catch (err) {
        console.error('Error fetching evaluation thresholds:', err);
      } finally {
        setLoadingThresholds(false);
      }
    };
    
    fetchThresholds();
  }, []);

  useEffect(() => {
    const fetchEvaluations = async () => {
      if (!projectId) return;

      setIsLoading(true);
      try {
        const allEvaluationResponse = await evaluationService.getEvaluationByFounder(projectId);

        const allEvaluationData = allEvaluationResponse?.data || allEvaluationResponse || [];

        console.log('All evaluations data:', allEvaluationData);

        if (Array.isArray(allEvaluationData) && allEvaluationData.length > 0) {
          setAllEvaluations(allEvaluationData);

          const groups = {};
          let maxVersion = 0;

          allEvaluationData.forEach(evaluation => {
            const version = evaluation.version || 0;
            if (!groups[version]) {
              groups[version] = [];
            }
            groups[version].push(evaluation);

            if (version > maxVersion) {
              maxVersion = version;
            }
          });

          setVersionGroups(groups);
          setLatestVersion(maxVersion);
          setPreviousVersion(maxVersion > 1 ? maxVersion - 1 : 0);

          if (groups[maxVersion]) {
            setLatestEvaluations(groups[maxVersion]);

            const actual = groups[maxVersion].reduce((sum, evaluation) => sum + (evaluation.actualPoint || 0), 0);
            const maximum = groups[maxVersion].reduce((sum, evaluation) => sum + (evaluation.maximumPoint || 0), 0);
            setLatestTotalScore({ actual, maximum });
          }

          const actual = allEvaluationData.reduce((sum, evaluation) => sum + (evaluation.actualPoint || 0), 0);
          const maximum = allEvaluationData.reduce((sum, evaluation) => sum + (evaluation.maximumPoint || 0), 0);
          setTotalScore({ actual, maximum });
        }
      } catch (err) {
        console.error('Error fetching project evaluations:', err);
        setError('Failed to load project evaluations. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvaluations();
  }, [projectId]);

  const calculatePercentage = (actual, maximum) => {
    return maximum > 0 ? Math.round((actual / maximum) * 100) : 0;
  };

  const getScoreColor = (percentage) => {
    const percentageValue = percentage / 100; 
    
    if (percentageValue >= thresholds.excellent) return 'bg-green-500';
    if (percentageValue >= thresholds.pass) return 'bg-blue-500';
    if (percentageValue >= thresholds.resubmit) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getTextColor = (percentage) => {
    const percentageValue = percentage / 100; 
    
    if (percentageValue >= thresholds.excellent) return 'text-green-700';
    if (percentageValue >= thresholds.pass) return 'text-blue-700';
    if (percentageValue >= thresholds.resubmit) return 'text-yellow-700';
    return 'text-red-700';
  };

  // Updated to use dynamically loaded thresholds
  const getScoreDescription = (percentage) => {
    const percentageValue = percentage / 100; 
    
    if (percentageValue >= thresholds.excellent) return 'Excellent';
    if (percentageValue >= thresholds.pass) return 'Great';
    if (percentageValue >= thresholds.resubmit * 2) return 'Good';
    if (percentageValue >= thresholds.resubmit) return 'Needs Improvement';
    return 'Requires Attention';
  };

  const calculateChange = (currentEval) => {
    if (!currentEval || !previousVersion || !versionGroups[previousVersion]) return 0;

    const previousEvals = versionGroups[previousVersion].filter(evaluation =>
      evaluation.typeName === currentEval.typeName
    );

    if (previousEvals.length === 0) return 0;

    const previousEval = previousEvals[0];

    const previousPercentage = calculatePercentage(
      previousEval.actualPoint,
      previousEval.maximumPoint
    );

    const currentPercentage = calculatePercentage(
      currentEval.actualPoint,
      currentEval.maximumPoint
    );
    return currentPercentage - previousPercentage;
  };

  const getScoreIcon = (percentage) => {
    const percentageValue = percentage / 100; 
    
    if (percentageValue >= thresholds.excellent) {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-emerald-500" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
      );
    }
    if (percentageValue >= thresholds.pass) {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
          <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
          <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
        </svg>
      );
    }
    if (percentageValue >= thresholds.resubmit) {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber-500" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
      );
    }
    return (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-rose-500" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
      </svg>
    );
  };

  const getChangeIcon = (change) => {
    if (change > 0) {
      return (
        <span className="inline-flex items-center text-green-600">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
          </svg>
          <span className="text-xs ml-1">+{change}%</span>
        </span>
      );
    } else if (change < 0) {
      return (
        <span className="inline-flex items-center text-red-600">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
          <span className="text-xs ml-1">{change}%</span>
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center text-gray-500">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" />
          </svg>
          <span className="text-xs ml-1">0%</span>
        </span>
      );
    }
  };

  // Calculate total score for a specific version
  const calculateVersionTotal = (version) => {
    if (!versionGroups[version]) return { actual: 0, maximum: 0, percentage: 0 };

    const evals = versionGroups[version];
    const actual = evals.reduce((sum, evaluation) => sum + (evaluation.actualPoint || 0), 0);
    const maximum = evals.reduce((sum, evaluation) => sum + (evaluation.maximumPoint || 0), 0);
    const percentage = calculatePercentage(actual, maximum);

    return { actual, maximum, percentage };
  };

  // Calculate the change in total score between latest and previous version
  const calculateTotalScoreChange = () => {
    if (!previousVersion) return 0;

    const latestTotal = calculateVersionTotal(latestVersion);
    const previousTotal = calculateVersionTotal(previousVersion);

    return latestTotal.percentage - previousTotal.percentage;
  };

  if (isLoading || loadingThresholds) {
    return (
      <div className="bg-white shadow-md rounded-lg p-6 mb-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-6"></div>
        <div className="h-16 bg-gray-100 rounded-lg w-full mb-6"></div>
        <div className="space-y-5">
          <div className="h-24 bg-gray-100 rounded-lg w-full"></div>
          <div className="h-24 bg-gray-100 rounded-lg w-full"></div>
          <div className="h-24 bg-gray-100 rounded-lg w-full"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-rose-50 border-l-4 border-rose-400 p-6 mb-6 rounded-lg shadow-sm">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-rose-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-base text-rose-700 font-medium">{error}</p>
            <p className="mt-1 text-sm text-rose-600">Please refresh or try again later.</p>
          </div>
        </div>
      </div>
    );
  }

  // Fixed the condition to check for empty evaluations
  if (!allEvaluations || allEvaluations.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 mb-6 shadow-sm text-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p className="text-gray-600 font-medium">No evaluations available for this project yet.</p>
        <p className="text-sm text-gray-500 mt-2">Evaluations will appear here once assessments are submitted.</p>
      </div>
    );
  }

  // Get the total score change
  const totalScoreChange = calculateTotalScoreChange();

  return (
    <div className="space-y-4 mt-2">
      {/* Latest Evaluation Card */}
      <div className="bg-white shadow-lg rounded-lg overflow-hidden border border-gray-100">
        <button
          className="w-full bg-gradient-to-r from-blue-600 to-blue-400 px-6 py-4 flex justify-between items-center"
          onClick={() => setIsLatestExpanded(!isLatestExpanded)}
        >
          <h3 className="text-lg font-semibold text-white flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Latest Evaluation (Version {latestVersion})
          </h3>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className={`h-5 w-5 text-white transition-transform duration-300 ${isLatestExpanded ? 'transform rotate-180' : ''}`}
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>

        {/* Latest Score (Always visible regardless of accordion state) */}
        <div className="bg-gradient-to-b from-blue-50 to-white p-6 border-b border-gray-200">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
            <div className="flex-1">
              <div className="flex items-center mb-1">
                <span className="text-sm font-medium uppercase tracking-wider text-gray-500 block">Latest Score</span>
                {previousVersion > 0 && getChangeIcon(totalScoreChange)}
              </div>

              {/* Latest version total score bar */}
              {(() => {
                const latestTotal = calculateVersionTotal(latestVersion);
                return (
                  <>
                    <div className="w-full bg-gray-200 rounded-full h-3 mb-3">
                      <div
                        className={`h-3 rounded-full ${getScoreColor(latestTotal.percentage)} transition-all duration-500 ease-in-out`}
                        style={{ width: `${latestTotal.percentage}%` }}
                      ></div>
                    </div>
                    <div className="flex items-baseline">
                      <span className={`text-sm font-medium ${getTextColor(latestTotal.percentage)}`}>
                        {getScoreDescription(latestTotal.percentage)}
                      </span>
                      <span className="text-xs text-gray-500 ml-2">({latestTotal.percentage}%)</span>
                    </div>
                  </>
                );
              })()}
            </div>

            <div className="flex-shrink-0">
              {(() => {
                const latestTotal = calculateVersionTotal(latestVersion);
                return (
                  <div className="flex items-center justify-center w-24 h-24 rounded-full bg-blue-50 border-4 border-blue-100 shadow-inner">
                    <div className="text-center">
                      <span className="block text-2xl font-bold text-gray-800">{latestTotal.actual}</span>
                      <span className="block text-xs text-gray-500">out of {latestTotal.maximum}</span>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>

        {/* Latest Individual Evaluation Categories (Expandable) */}
        <div className={`overflow-hidden transition-all duration-500 ${isLatestExpanded ? 'max-h-full' : 'max-h-0'}`}>
          {versionGroups[latestVersion] && versionGroups[latestVersion].length > 0 ? (
            <div className="p-6 space-y-4">
              {versionGroups[latestVersion].map((evaluation) => {
                const percentage = calculatePercentage(evaluation.actualPoint, evaluation.maximumPoint);
                const change = calculateChange(evaluation);

                return (
                  <div key={`latest-${evaluation.id}`} className="bg-blue-50 rounded-lg p-4 shadow-sm border border-blue-100 hover:shadow-md transition-shadow duration-200">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div className="flex items-center">
                          {getScoreIcon(percentage)}
                          <span className="ml-2 text-base font-semibold text-gray-800">
                            {evaluation.typeName.replace(/_/g, ' ')}
                          </span>
                          {previousVersion > 0 && <div className="ml-2">{getChangeIcon(change)}</div>}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Evaluated by <span className="font-medium">{evaluation.managerName}</span></p>
                      </div>
                      <div className="bg-white px-3 py-1 rounded-full border border-blue-100">
                        <span className="text-lg font-bold text-gray-800">{evaluation.actualPoint}</span>
                        <span className="text-sm text-gray-500">/{evaluation.maximumPoint}</span>
                      </div>
                    </div>

                    <div className="w-full bg-white rounded-full h-2.5 mb-2">
                      <div
                        className={`h-2.5 rounded-full ${getScoreColor(percentage)} transition-all duration-500 ease-in-out`}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>

                    <div className="flex justify-between text-xs">
                      <span className={`font-medium ${getTextColor(percentage)}`}>{getScoreDescription(percentage)}</span>
                      <span className="text-gray-500">{percentage}%</span>
                    </div>

                    {evaluation.comment && (
                      <div className="mt-3 bg-white p-3 rounded-lg border-l-4 border-blue-300">
                        <p className="text-sm text-gray-700 italic">
                          &quot;{evaluation.comment}&quot;
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Legend and explanation */}
              <div className="bg-blue-50 px-6 py-4 border-t border-blue-100 mt-4 rounded-lg">
                <div className="flex items-center mb-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm font-medium text-blue-700">Evaluation Metrics</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="bg-white p-3 rounded shadow-sm border border-blue-100">
                    <p className="text-xs font-semibold text-gray-700">Team Competence</p>
                    <p className="text-xs text-gray-600 mt-1">Evaluates team diversity, skills, and collaboration effectiveness</p>
                  </div>
                  <div className="bg-white p-3 rounded shadow-sm border border-blue-100">
                    <p className="text-xs font-semibold text-gray-700">Project Document</p>
                    <p className="text-xs text-gray-600 mt-1">Reviews quality of business plan, SWOT analysis, and financial documents</p>
                  </div>
                  <div className="bg-white p-3 rounded shadow-sm border border-blue-100">
                    <p className="text-xs font-semibold text-gray-700">Project Story</p>
                    <p className="text-xs text-gray-600 mt-1">Assesses clarity, credibility, and appeal of project presentation</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-6 text-center">
              <p className="text-gray-600">No latest evaluation data available.</p>
            </div>
          )}
        </div>
      </div>

      {/* Previous Version Evaluation Card */}
      {previousVersion > 0 && versionGroups[previousVersion] && (
        <div className="bg-white shadow-lg rounded-lg overflow-hidden border border-gray-100">
          <button
            className="w-full bg-gradient-to-r from-gray-600 to-gray-500 px-6 py-4 flex justify-between items-center"
            onClick={() => setIsHistoryExpanded(!isHistoryExpanded)}
          >
            <h3 className="text-lg font-semibold text-white flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Previous Evaluation (Version {previousVersion})
            </h3>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className={`h-5 w-5 text-white transition-transform duration-300 ${isHistoryExpanded ? 'transform rotate-180' : ''}`}
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>

          {/* Previous Version Score Summary (Always visible) */}
          <div className="bg-gradient-to-b from-gray-50 to-white p-6 border-b border-gray-200">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
              <div className="flex-1">
                <span className="text-sm font-medium uppercase tracking-wider text-gray-500 block mb-1">Previous Version Score</span>
                <div className="w-full bg-gray-200 rounded-full h-3 mb-3">
                  {(() => {
                    const previousTotal = calculateVersionTotal(previousVersion);
                    return (
                      <div
                        className={`h-3 rounded-full ${getScoreColor(previousTotal.percentage)} transition-all duration-500 ease-in-out`}
                        style={{ width: `${previousTotal.percentage}%` }}
                      ></div>
                    );
                  })()}
                </div>
                <div className="flex items-baseline">
                  {(() => {
                    const previousTotal = calculateVersionTotal(previousVersion);
                    return (
                      <>
                        <span className={`text-sm font-medium ${getTextColor(previousTotal.percentage)}`}>
                          {getScoreDescription(previousTotal.percentage)}
                        </span>
                        <span className="text-xs text-gray-500 ml-2">({previousTotal.percentage}%)</span>
                      </>
                    );
                  })()}
                </div>
              </div>

              <div className="flex-shrink-0">
                {(() => {
                  const previousTotal = calculateVersionTotal(previousVersion);
                  return (
                    <div className="flex items-center justify-center w-24 h-24 rounded-full bg-gray-50 border-4 border-gray-100 shadow-inner">
                      <div className="text-center">
                        <span className="block text-2xl font-bold text-gray-800">{previousTotal.actual}</span>
                        <span className="block text-xs text-gray-500">out of {previousTotal.maximum}</span>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>

          {/* Expandable Previous Version Details */}
          <div className={`overflow-hidden transition-all duration-500 ${isHistoryExpanded ? 'max-h-full' : 'max-h-0'}`}>
            <div className="p-6 space-y-4">
              {versionGroups[previousVersion].map((evaluation) => {
                const percentage = calculatePercentage(evaluation.actualPoint, evaluation.maximumPoint);

                return (
                  <div
                    key={evaluation.id}
                    className="bg-white rounded-lg p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div className="flex items-center">
                          {getScoreIcon(percentage)}
                          <span className="ml-2 text-base font-semibold text-gray-800">
                            {evaluation.typeName.replace(/_/g, ' ')}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Evaluated by <span className="font-medium">{evaluation.managerName}</span></p>
                      </div>
                      <div className="bg-gray-50 px-3 py-1 rounded-full border border-gray-100">
                        <span className="text-lg font-bold text-gray-800">{evaluation.actualPoint}</span>
                        <span className="text-sm text-gray-500">/{evaluation.maximumPoint}</span>
                      </div>
                    </div>

                    <div className="w-full bg-gray-100 rounded-full h-2.5 mb-2">
                      <div
                        className={`h-2.5 rounded-full ${getScoreColor(percentage)} transition-all duration-500 ease-in-out`}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>

                    <div className="flex justify-between text-xs">
                      <span className={`font-medium ${getTextColor(percentage)}`}>{getScoreDescription(percentage)}</span>
                      <span className="text-gray-500">{percentage}%</span>
                    </div>

                    {evaluation.comment && (
                      <div className="mt-3 bg-gray-50 p-3 rounded-lg border-l-4 border-gray-300">
                        <p className="text-sm text-gray-700 italic">
                          &quot;{evaluation.comment}&quot;
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Legend and explanation */}
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
              <div className="flex items-center mb-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm font-medium text-gray-700">Evaluation Metrics</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="bg-white p-3 rounded shadow-sm border border-gray-100">
                  <p className="text-xs font-semibold text-gray-700">Team Competence</p>
                  <p className="text-xs text-gray-600 mt-1">Evaluates team diversity, skills, and collaboration effectiveness</p>
                </div>
                <div className="bg-white p-3 rounded shadow-sm border border-gray-100">
                  <p className="text-xs font-semibold text-gray-700">Project Document</p>
                  <p className="text-xs text-gray-600 mt-1">Reviews quality of business plan, SWOT analysis, and financial documents</p>
                </div>
                <div className="bg-white p-3 rounded shadow-sm border border-gray-100">
                  <p className="text-xs font-semibold text-gray-700">Project Story</p>
                  <p className="text-xs text-gray-600 mt-1">Assesses clarity, credibility, and appeal of project presentation</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

ProjectEvaluationPoint.propTypes = {
  projectId: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number
  ]).isRequired
};

export default ProjectEvaluationPoint;