// No explicit React or ReactDOM imports here.
// They are loaded globally via CDN in index.html, making React, ReactDOM,
// and their sub-properties (like useState, useEffect, createContext, useContext, useRef, ReactDOM.createRoot)
// available in the global scope.

// Context for App-wide state and utilities
const AppContext = React.createContext();

// Utility function to format dates
const formatDate = (date) => {
  // Ensure date is a Date object for formatting, even if stored as string
  return new Date(date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
};

// Utility function for robust date comparison (year, month, day)
const isSameDay = (date1, date2) => {
  if (!date1 || !date2) return false;
  // Convert both inputs to YYYY-MM-DD strings for consistent comparison
  const d1String = (date1 instanceof Date) ? date1.toISOString().split('T')[0] : date1;
  const d2String = (date2 instanceof Date) ? date2.toISOString().split('T')[0] : date2;
  return d1String === d2String;
};

// Utility function to get all weekdays between two dates
const getWeekdaysInRange = (startDate, endDate) => {
  const dates = [];
  let currentDate = new Date(startDate);
  currentDate.setHours(0, 0, 0, 0); // Normalize to start of day

  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999); // Normalize to end of day

  while (currentDate <= end) {
    const dayOfWeek = currentDate.getDay(); // 0 = Sunday, 6 = Saturday
    if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Exclude Sunday (0) and Saturday (6)
      dates.push(new Date(currentDate));
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }
  return dates;
};

// Theme definitions
const themes = {
  default: {
    primaryBg: 'bg-blue-50',
    secondaryBg: 'bg-white',
    textColor: 'text-gray-800',
    accentColor: 'bg-blue-600 text-white',
    borderColor: 'border-blue-200',
    hoverBg: 'hover:bg-blue-100',
    buttonBg: 'bg-blue-500 hover:bg-blue-600 text-white',
    inputBorder: 'border-gray-300 focus:border-blue-500',
    gradedBg: 'bg-red-100',
    gradedBorder: 'border-red-400',
  },
  modern: {
    primaryBg: 'bg-gray-100',
    secondaryBg: 'bg-white',
    textColor: 'text-gray-900',
    accentColor: 'bg-purple-600 text-white',
    borderColor: 'border-gray-300',
    hoverBg: 'hover:bg-gray-200',
    buttonBg: 'bg-purple-500 hover:bg-purple-600 text-white',
    inputBorder: 'border-gray-400 focus:border-purple-500',
    gradedBg: 'bg-pink-100',
    gradedBorder: 'border-pink-400',
  },
  monochrome: {
    primaryBg: 'bg-gray-50',
    secondaryBg: 'bg-white',
    textColor: 'text-gray-800',
    accentColor: 'bg-gray-700 text-white',
    borderColor: 'border-gray-300',
    hoverBg: 'hover:bg-gray-100',
    buttonBg: 'bg-gray-600 hover:bg-gray-700 text-white',
    inputBorder: 'border-gray-300 focus:border-gray-600',
    gradedBg: 'bg-red-50',
    gradedBorder: 'border-red-300',
  },
  watercolors: {
    primaryBg: 'bg-gradient-to-br from-purple-50 to-pink-50',
    secondaryBg: 'bg-white bg-opacity-80 rounded-lg shadow-md',
    textColor: 'text-gray-800',
    accentColor: 'bg-pink-500 text-white',
    borderColor: 'border-purple-200',
    hoverBg: 'hover:bg-purple-50',
    buttonBg: 'bg-pink-400 hover:bg-pink-500 text-white',
    inputBorder: 'border-purple-300 focus:border-pink-400',
    gradedBg: 'bg-red-100 bg-opacity-80',
    gradedBorder: 'border-red-400',
  },
  earthy: {
    primaryBg: 'bg-amber-50',
    secondaryBg: 'bg-white',
    textColor: 'text-stone-800',
    accentColor: 'bg-green-700 text-white',
    borderColor: 'border-amber-200',
    hoverBg: 'hover:bg-amber-100',
    buttonBg: 'bg-green-600 hover:bg-green-700 text-white',
    inputBorder: 'border-stone-300 focus:border-green-600',
    gradedBg: 'bg-red-100',
    gradedBorder: 'border-red-400',
  },
  earthToned: {
    primaryBg: 'bg-yellow-50',
    secondaryBg: 'bg-white',
    textColor: 'text-gray-800',
    accentColor: 'bg-orange-600 text-white',
    borderColor: 'border-yellow-200',
    hoverBg: 'hover:bg-yellow-100',
    buttonBg: 'bg-orange-500 hover:bg-orange-600 text-white',
    inputBorder: 'border-yellow-300 focus:border-orange-500',
    gradedBg: 'bg-red-100',
    gradedBorder: 'border-red-400',
  },
};

// Main App Component
function App() {
  const [units, setUnits] = React.useState([]);
  const [lessons, setLessons] = React.useState([]);
  const [selectedUnit, setSelectedUnit] = React.useState(null);
  const [currentView, setCurrentView] = React.useState('listView'); // listView, weeklyView, monthlyView
  const [currentTheme, setCurrentTheme] = React.useState('default');
  const [showModal, setShowModal] = React.useState(false);
  const [modalType, setModalType] = React.useState(''); // 'addUnit', 'addLesson', 'editLesson', 'confirmDeleteUnit'
  const [lessonToEdit, setLessonToEdit] = React.useState(null);
  const [lessonDate, setLessonDate] = React.useState(null); // Will store Date object for new lesson modal
  const [unitToDelete, setUnitToDelete] = React.useState(null);
  const [message, setMessage] = React.useState('');
  const [messageType, setMessageType] = React.useState(''); // 'success', 'error'
  const messageTimeoutRef = React.useRef(null);
  const [localUserId, setLocalUserId] = React.useState(''); // For local storage, a persistent 'user ID'

  // Load data from localStorage on initial render
  React.useEffect(() => {
    try {
      const storedUnits = JSON.parse(localStorage.getItem('lessonPlannerUnits') || '[]');
      const storedLessons = JSON.parse(localStorage.getItem('lessonPlannerLessons') || '[]');
      const storedUserId = localStorage.getItem('lessonPlannerUserId');

      setUnits(storedUnits);
      setLessons(storedLessons);

      if (storedUnits.length > 0) {
        setSelectedUnit(storedUnits[0]); // Select the first unit by default
      }

      if (storedUserId) {
        setLocalUserId(storedUserId);
      } else {
        const newUserId = crypto.randomUUID(); // Generate a new UUID if none exists
        localStorage.setItem('lessonPlannerUserId', newUserId);
        setLocalUserId(newUserId);
      }

    } catch (e) {
      console.error("Failed to load data from local storage:", e);
      showAppMessage("Error loading data from local storage. Your data might be corrupted.", 'error');
    }
  }, []);

  // Save units to localStorage whenever they change
  React.useEffect(() => {
    try {
      localStorage.setItem('lessonPlannerUnits', JSON.stringify(units));
    } catch (e) {
      console.error("Failed to save units to local storage:", e);
      showAppMessage("Error saving units to local storage.", 'error');
    }
  }, [units]);

  // Save lessons to localStorage whenever they change
  React.useEffect(() => {
    try {
      localStorage.setItem('lessonPlannerLessons', JSON.stringify(lessons));
    } catch (e) {
      console.error("Failed to save lessons to local storage:", e);
      showAppMessage("Error saving lessons to local storage.", 'error');
    }
  }, [lessons]);

  // Function to show messages
  const showAppMessage = (msg, type) => {
    setMessage(msg);
    setMessageType(type);
    if (messageTimeoutRef.current) {
      clearTimeout(messageTimeoutRef.current);
    }
    messageTimeoutRef.current = setTimeout(() => {
      setMessage('');
      setMessageType('');
    }, 3000); // Message disappears after 3 seconds
  };

  // Unit Management Functions
  const addUnit = (unitName, startDate, endDate) => {
    const newUnit = {
      id: crypto.randomUUID(), // Generate unique ID
      name: unitName,
      startDate: startDate ? startDate.toISOString().split('T')[0] : null, // Store as YYYY-MM-DD
      endDate: endDate ? endDate.toISOString().split('T')[0] : null,     // Store as YYYY-MM-DD
      order: units.length,
    };
    setUnits(prevUnits => {
      const updatedUnits = [...prevUnits, newUnit];
      // Ensure selectedUnit is set if this is the first unit added
      if (updatedUnits.length === 1) {
        setSelectedUnit(newUnit);
      }
      return updatedUnits;
    });
    showAppMessage('Unit added successfully!', 'success');
  };

  const updateUnitDates = (unitId, startDate, endDate) => {
    setUnits(prevUnits =>
      prevUnits.map(unit =>
        unit.id === unitId
          ? {
              ...unit,
              startDate: startDate ? startDate.toISOString().split('T')[0] : null, // Store as YYYY-MM-DD
              endDate: endDate ? endDate.toISOString().split('T')[0] : null,     // Store as YYYY-MM-DD
            }
          : unit
      )
    );
    showAppMessage('Unit dates updated successfully!', 'success');
  };

  const deleteUnit = (unitId) => {
    const lessonsInUnit = lessons.filter(lesson => lesson.unitId === unitId);
    if (lessonsInUnit.length > 0) {
      showAppMessage('Cannot delete unit: Please delete all lessons within this unit first.', 'error');
      return;
    }
    setUnits(prevUnits => {
      const updatedUnits = prevUnits.filter(unit => unit.id !== unitId);
      // If the deleted unit was selected, select the first available unit or null
      if (selectedUnit?.id === unitId) {
        setSelectedUnit(updatedUnits.length > 0 ? updatedUnits[0] : null);
      }
      return updatedUnits;
    });
    showAppMessage('Unit deleted successfully!', 'success');
  };

  const reorderUnits = (newOrder) => {
    setUnits(newOrder.map((unit, index) => ({ ...unit, order: index })));
    showAppMessage('Units reordered successfully!', 'success');
  };

  // Lesson Management Functions
  const addLesson = (lessonData) => {
    if (!selectedUnit) {
      showAppMessage('Please select a unit first.', 'error');
      return;
    }
    const newLesson = {
      id: crypto.randomUUID(), // Generate unique ID
      ...lessonData,
      unitId: selectedUnit.id,
      // Date is already YYYY-MM-DD string from form
      date: lessonData.date,
      // Simple ordering within date, will be re-calculated on drag-drop
      order: lessons.filter(l => l.unitId === selectedUnit.id && isSameDay(l.date, lessonData.date)).length,
    };
    setLessons(prevLessons => [...prevLessons, newLesson]);
    showAppMessage('Lesson added successfully!', 'success');
  };

  const updateLesson = (lessonId, updatedData) => {
    setLessons(prevLessons =>
      prevLessons.map(lesson =>
        lesson.id === lessonId
          ? {
              ...lesson,
              ...updatedData,
              // Date is already YYYY-MM-DD string from form
              date: updatedData.date,
            }
          : lesson
      )
    );
    showAppMessage('Lesson updated successfully!', 'success');
  };

  const deleteLesson = (lessonId) => {
    setLessons(prevLessons => prevLessons.filter(lesson => lesson.id !== lessonId));
    showAppMessage('Lesson deleted successfully!', 'success');
  };

  const reorderLesson = (lessonId, newDate, newOrder) => {
    setLessons(prevLessons =>
      prevLessons.map(lesson =>
        lesson.id === lessonId
          ? {
              ...lesson,
              // newDate is a Date object, convert to YYYY-MM-DD string
              date: newDate.toISOString().split('T')[0],
              order: newOrder,
            }
          : lesson
      )
    );
    showAppMessage('Lesson reordered successfully!', 'success');
  };

  const handleDragEndUnit = (newOrder) => {
    reorderUnits(newOrder);
  };

  const handleDragEndLesson = (draggedLessonId, sourceDateString, destinationDate, destinationIndex) => {
    setLessons(prevLessons => {
      const lessonsCopy = [...prevLessons];
      const draggedLesson = lessonsCopy.find(l => l.id === draggedLessonId);

      if (!draggedLesson) return prevLessons;

      // Remove from old position
      const filteredLessons = lessonsCopy.filter(l => l.id !== draggedLessonId);

      // Update the dragged lesson's properties
      const updatedDraggedLesson = {
        ...draggedLesson,
        // Ensure destinationDate is converted to 'YYYY-MM-DD' string
        date: destinationDate.toISOString().split('T')[0],
      };

      // Insert into new position
      const lessonsOnDestinationDate = filteredLessons
        .filter(l => isSameDay(l.date, updatedDraggedLesson.date)) // Compare string with string
        .sort((a, b) => a.order - b.order);

      lessonsOnDestinationDate.splice(destinationIndex, 0, updatedDraggedLesson);

      // Re-assign order for lessons on the destination date
      const reorderedDestinationLessons = lessonsOnDestinationDate.map((lesson, index) => ({ ...lesson, order: index }));

      // Combine back with other lessons
      const finalLessons = [
        ...filteredLessons.filter(l => !isSameDay(l.date, updatedDraggedLesson.date)), // Filter out lessons not on destination date
        ...reorderedDestinationLessons
      ];

      return finalLessons;
    });
    showAppMessage('Lesson reordered successfully!', 'success');
  };


  const openAddLessonModal = (date) => {
    // Pass the YYYY-MM-DD string of the date to the modal initialData
    setLessonDate(date.toISOString().split('T')[0]);
    setLessonToEdit(null);
    setModalType('addLesson');
    setShowModal(true);
  };

  const openEditLessonModal = (lesson) => {
    setLessonToEdit(lesson);
    // When editing, the stored lesson.date is a YYYY-MM-DD string.
    // The date input needs a YYYY-MM-DD string for its value.
    setLessonDate(lesson.date);
    setModalType('editLesson');
    setShowModal(true);
  };

  const openConfirmDeleteUnitModal = (unit) => {
    setUnitToDelete(unit);
    setModalType('confirmDeleteUnit');
    setShowModal(true);
  };

  // Filter lessons for the selected unit
  const filteredLessons = selectedUnit
    ? lessons.filter(lesson => lesson.unitId === selectedUnit.id)
    : [];

  const currentThemeClasses = themes[currentTheme];

  // --- Export/Import Functions ---
  const handleExportData = () => {
    const data = {
      units: units,
      lessons: lessons, // Lessons are already stored as YYYY-MM-DD strings
    };
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const today = new Date();
    const dateString = today.toISOString().split('T')[0]; //YYYY-MM-DD
    a.download = `lesson_planner_backup_${dateString}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showAppMessage('Data exported successfully!', 'success');
  };

  const handleImportData = (event) => {
    const file = event.target.files[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target.result);
        if (importedData.units && Array.isArray(importedData.units) &&
            importedData.lessons && Array.isArray(importedData.lessons)) {

          // Lessons are already stored as YYYY-MM-DD strings in the imported data,
          // so no conversion is needed here.
          setUnits(importedData.units);
          setLessons(importedData.lessons);
          if (importedData.units.length > 0) {
            setSelectedUnit(importedData.units[0]);
          } else {
            setSelectedUnit(null);
          }
          showAppMessage('Data imported successfully!', 'success');
        } else {
          showAppMessage('Invalid file format. Please import a valid lesson planner JSON file.', 'error');
        }
      } catch (error) {
        console.error("Error importing data:", error);
        showAppMessage('Error importing data. Make sure the file is a valid JSON.', 'error');
      }
    };
    reader.readAsText(file);
  };

  return (
    <AppContext.Provider value={{ showAppMessage, currentThemeClasses }}>
      <div className={`min-h-screen ${currentThemeClasses.primaryBg} ${currentThemeClasses.textColor} font-inter flex flex-col`}>
        {message && (
          <div className={`absolute top-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-lg shadow-lg z-50
            ${messageType === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
            {message}
          </div>
        )}

        <Header
          units={units}
          selectedUnit={selectedUnit}
          setSelectedUnit={setSelectedUnit}
          setCurrentView={setCurrentView}
          setCurrentTheme={setCurrentTheme}
          currentTheme={currentTheme}
          openAddUnitModal={() => { setModalType('addUnit'); setShowModal(true); }}
          handleDragEndUnit={handleDragEndUnit}
          localUserId={localUserId} // Pass localUserId for display
          handleExportData={handleExportData} // Pass export function
          handleImportData={handleImportData} // Pass import function
        />

        <main className="flex-1 p-4 overflow-auto">
          {selectedUnit ? (
            <LessonPlanner
              unit={selectedUnit}
              lessons={filteredLessons}
              currentView={currentView}
              updateUnitDates={updateUnitDates}
              openAddLessonModal={openAddLessonModal}
              openEditLessonModal={openEditLessonModal}
              deleteLesson={deleteLesson}
              handleDragEndLesson={handleDragEndLesson}
              openConfirmDeleteUnitModal={openConfirmDeleteUnitModal}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center py-20">
              <p className="text-xl font-semibold mb-4">No unit selected or created yet.</p>
              <button
                onClick={() => { setModalType('addUnit'); setShowModal(true); }}
                className={`${currentThemeClasses.buttonBg} px-6 py-3 rounded-xl font-semibold shadow-md transition duration-300 ease-in-out transform hover:scale-105`}
              >
                Add Your First Unit
              </button>
            </div>
          )}
        </main>

        {showModal && (
          <Modal onClose={() => setShowModal(false)}>
            {modalType === 'addUnit' && (
              <AddUnitForm
                onAdd={addUnit}
                onClose={() => setShowModal(false)}
              />
            )}
            {modalType === 'addLesson' && (
              <LessonForm
                onSave={addLesson}
                onClose={() => setShowModal(false)}
                initialData={{ date: lessonDate }} // Pass the YYYY-MM-DD string
              />
            )}
            {modalType === 'editLesson' && (
              <LessonForm
                onSave={(data) => updateLesson(lessonToEdit.id, data)}
                onClose={() => setShowModal(false)}
                initialData={lessonToEdit}
              />
            )}
            {modalType === 'confirmDeleteUnit' && (
              <ConfirmDeleteUnitModal
                unit={unitToDelete}
                onConfirm={() => { deleteUnit(unitToDelete.id); setShowModal(false); }}
                onClose={() => setShowModal(false)}
              />
            )}
          </Modal>
        )}
      </div>
    </AppContext.Provider>
  );
}

// Header Component (Units, Main Menu, Theme Selector)
const Header = ({ units, selectedUnit, setSelectedUnit, setCurrentView, setCurrentTheme, currentTheme, openAddUnitModal, handleDragEndUnit, localUserId, handleExportData, handleImportData }) => {
  const { currentThemeClasses } = React.useContext(AppContext);
  const [showMenu, setShowMenu] = React.useState(false);
  const fileInputRef = React.useRef(null); // Ref for the hidden file input

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  return (
    <header className={`p-4 shadow-md ${currentThemeClasses.secondaryBg} rounded-b-xl`}>
      <div className="flex flex-col md:flex-row justify-between items-center mb-4">
        <h1 className="text-3xl font-bold mb-2 md:mb-0">Lesson Planner</h1>
        <div className="flex items-center space-x-4">
          <p className="text-sm">User ID: <span className="font-mono text-xs break-all">{localUserId || 'N/A'}</span></p>
          <button
            onClick={() => setShowMenu(!showMenu)}
            className={`${currentThemeClasses.buttonBg} px-4 py-2 rounded-xl font-semibold shadow-md transition duration-300 ease-in-out transform hover:scale-105`}
          >
            Menu
          </button>
        </div>
      </div>

      {showMenu && (
        <div className={`absolute right-4 mt-2 w-48 ${currentThemeClasses.secondaryBg} rounded-xl shadow-lg z-50 p-4`}> {/* Increased z-index */}
          <h3 className="font-bold mb-2">Views</h3>
          <ul className="space-y-1 mb-4">
            <li><button onClick={() => { setCurrentView('listView'); setShowMenu(false); }} className={`w-full text-left py-1 px-2 rounded ${currentThemeClasses.hoverBg}`}>List View</button></li>
            <li><button onClick={() => { setCurrentView('weeklyView'); setShowMenu(false); }} className={`w-full text-left py-1 px-2 rounded ${currentThemeClasses.hoverBg}`}>Weekly View</button></li>
            <li><button onClick={() => { setCurrentView('monthlyView'); setShowMenu(false); }} className={`w-full text-left py-1 px-2 rounded ${currentThemeClasses.hoverBg}`}>Monthly Calendar View</button></li>
          </ul>

          <h3 className="font-bold mb-2">Themes</h3>
          <select
            value={currentTheme}
            onChange={(e) => { setCurrentTheme(e.target.value); setShowMenu(false); }}
            className={`w-full p-2 rounded ${currentThemeClasses.inputBorder} ${currentThemeClasses.secondaryBg} ${currentThemeClasses.textColor}`}
          >
            {Object.keys(themes).map(themeName => (
              <option key={themeName} value={themeName}>{themeName.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</option>
            ))}
          </select>

          <h3 className="font-bold mb-2 mt-4">Data Management</h3>
          <ul className="space-y-1">
            <li>
              <button
                onClick={() => { handleExportData(); setShowMenu(false); }}
                className={`w-full text-left py-1 px-2 rounded ${currentThemeClasses.hoverBg}`}
              >
                Export Data
              </button>
            </li>
            <li>
              <button
                onClick={() => { triggerFileInput(); setShowMenu(false); }}
                className={`w-full text-left py-1 px-2 rounded ${currentThemeClasses.hoverBg}`}
              >
                Import Data
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImportData}
                accept=".json"
                className="hidden"
              />
            </li>
          </ul>
        </div>
      )}

      <UnitBar
        units={units}
        selectedUnit={selectedUnit}
        setSelectedUnit={setSelectedUnit}
        openAddUnitModal={openAddUnitModal}
        handleDragEndUnit={handleDragEndUnit}
      />
    </header>
  );
};

// Unit Bar Component (Draggable Units)
const UnitBar = ({ units, selectedUnit, setSelectedUnit, openAddUnitModal, handleDragEndUnit }) => {
  const { currentThemeClasses } = React.useContext(AppContext);
  const dragItem = React.useRef(null);
  const dragOverItem = React.useRef(null);

  const handleDragStart = (e, index) => {
    dragItem.current = index;
  };

  const handleDragEnter = (e, index) => {
    dragOverItem.current = index;
  };

  const handleDrop = () => {
    const unitsCopy = [...units];
    const draggedContent = unitsCopy[dragItem.current];
    unitsCopy.splice(dragItem.current, 1);
    unitsCopy.splice(dragOverItem.current, 0, draggedContent);
    dragItem.current = null;
    dragOverItem.current = null;
    handleDragEndUnit(unitsCopy); // Pass the reordered array to parent
  };

  return (
    <div className="flex overflow-x-auto py-2 space-x-2 scrollbar-hide">
      {units.map((unit, index) => (
        <div
          key={unit.id}
          className={`flex-shrink-0 px-4 py-2 rounded-xl cursor-pointer transition duration-200 ease-in-out
            ${selectedUnit?.id === unit.id ? currentThemeClasses.accentColor : `${currentThemeClasses.secondaryBg} ${currentThemeClasses.borderColor} border`}
            ${currentThemeClasses.hoverBg}`}
          onClick={() => setSelectedUnit(unit)}
          draggable
          onDragStart={(e) => handleDragStart(e, index)}
          onDragEnter={(e) => handleDragEnter(e, index)}
          onDragEnd={handleDrop}
          onDragOver={(e) => e.preventDefault()}
        >
          {unit.name}
        </div>
      ))}
      <button
        onClick={openAddUnitModal}
        className={`${currentThemeClasses.buttonBg} flex-shrink-0 px-4 py-2 rounded-xl font-semibold shadow-md transition duration-300 ease-in-out transform hover:scale-105`}
      >
        + Add Unit
      </button>
    </div>
  );
};

// Lesson Planner Component (Main content area)
const LessonPlanner = ({
  unit,
  lessons,
  currentView,
  updateUnitDates,
  openAddLessonModal,
  openEditLessonModal,
  deleteLesson,
  handleDragEndLesson,
  openConfirmDeleteUnitModal,
}) => {
  const { currentThemeClasses, showAppMessage } = React.useContext(AppContext);
  const [startDate, setStartDate] = React.useState(unit.startDate ? new Date(unit.startDate + 'T00:00:00') : null); // Ensure Date object
  const [endDate, setEndDate] = React.useState(unit.endDate ? new Date(unit.endDate + 'T00:00:00') : null);     // Ensure Date object

  React.useEffect(() => {
    setStartDate(unit.startDate ? new Date(unit.startDate + 'T00:00:00') : null);
    setEndDate(unit.endDate ? new Date(unit.endDate + 'T00:00:00') : null);
  }, [unit.startDate, unit.endDate]);

  const handleDateChange = (type, dateString) => {
    // dateString from input is YYYY-MM-DD. Convert to Date object (local time)
    const date = dateString ? new Date(dateString + 'T00:00:00') : null;
    if (type === 'start') {
      setStartDate(date);
    } else {
      setEndDate(date);
    }
  };

  const handleUpdateDates = () => {
    if (startDate && endDate && startDate > endDate) {
      showAppMessage('Start date cannot be after end date.', 'error');
      return;
    }
    updateUnitDates(unit.id, startDate, endDate);
  };

  const weekdays = startDate && endDate ? getWeekdaysInRange(startDate, endDate) : [];

  const lessonsByDate = weekdays.reduce((acc, date) => {
    acc[date.toDateString()] = lessons // Use toDateString as key for consistency with droppableId
      .filter(lesson => isSameDay(lesson.date, date)) // Use isSameDay with lesson.date (string) and date (Date object)
      .sort((a, b) => a.order - b.order);
    return acc;
  }, {});

  const renderView = () => {
    switch (currentView) {
      case 'listView':
        return (
          <ListView
            weekdays={weekdays}
            lessonsByDate={lessonsByDate}
            openAddLessonModal={openAddLessonModal}
            openEditLessonModal={openEditLessonModal}
            deleteLesson={deleteLesson}
            handleDragEndLesson={handleDragEndLesson}
          />
        );
      case 'weeklyView':
        return (
          <WeeklyView
            weekdays={weekdays}
            lessonsByDate={lessonsByDate}
            openAddLessonModal={openAddLessonModal}
            openEditLessonModal={openEditLessonModal}
            deleteLesson={deleteLesson}
            handleDragEndLesson={handleDragEndLesson}
          />
        );
      case 'monthlyView':
        return (
          <MonthlyView
            lessons={lessons} // Pass all lessons for monthly view
            selectedUnitId={unit.id}
            openAddLessonModal={openAddLessonModal}
            openEditLessonModal={openEditLessonModal}
            deleteLesson={deleteLesson}
            handleDragEndLesson={handleDragEndLesson}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className={`p-4 rounded-xl shadow-lg ${currentThemeClasses.secondaryBg}`}>
      <div className="flex justify-between items-center mb-4 pb-4 border-b-2 border-dashed" style={{ borderColor: currentThemeClasses.borderColor.split('-').pop() }}>
        <h2 className="text-2xl font-bold">{unit.name}</h2>
        <button
          onClick={() => openConfirmDeleteUnitModal(unit)}
          className="text-red-500 hover:text-red-700 font-semibold transition duration-200 ease-in-out"
        >
          Delete Unit
        </button>
      </div>

      <div className="mb-6 p-4 rounded-lg border-2" style={{ borderColor: currentThemeClasses.borderColor.split('-').pop() }}>
        <h3 className="text-lg font-semibold mb-2">Unit Date Range</h3>
        <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-4">
          <label className="flex items-center space-x-2">
            <span>Start Date:</span>
            <input
              type="date"
              value={startDate ? startDate.toISOString().split('T')[0] : ''}
              onChange={(e) => handleDateChange('start', e.target.value)}
              className={`p-2 rounded ${currentThemeClasses.inputBorder} ${currentThemeClasses.secondaryBg} ${currentThemeClasses.textColor}`}
            />
          </label>
          <label className="flex items-center space-x-2">
            <span>End Date:</span>
            <input
              type="date"
              value={endDate ? endDate.toISOString().split('T')[0] : ''}
              onChange={(e) => handleDateChange('end', e.target.value)}
              className={`p-2 rounded ${currentThemeClasses.inputBorder} ${currentThemeClasses.secondaryBg} ${currentThemeClasses.textColor}`}
            />
          </label>
          <button
            onClick={handleUpdateDates}
            className={`${currentThemeClasses.buttonBg} px-4 py-2 rounded-xl font-semibold shadow-md transition duration-300 ease-in-out transform hover:scale-105`}
          >
            Update Dates
          </button>
        </div>
      </div>

      {renderView()}
    </div>
  );
};

// View Components
const ListView = ({ weekdays, lessonsByDate, openAddLessonModal, openEditLessonModal, deleteLesson, handleDragEndLesson }) => {
  const { currentThemeClasses } = React.useContext(AppContext);
  return (
    <div className={`p-4 rounded-lg shadow-md border ${currentThemeClasses.borderColor}`}>
      {weekdays.length === 0 && (
        <p className="text-center text-gray-500 py-4">Please set a date range for this unit.</p>
      )}
      <div className="flex flex-col"> {/* Use flex-col for vertical stacking of date rows */}
        {weekdays.map((date) => (
          <div key={date.toDateString()} className="flex flex-col md:flex-row border-b last:border-b-0 py-4" style={{ borderColor: currentThemeClasses.borderColor.split('-').pop() }}>
            {/* Left Column: Date and Add Button */}
            <div className="flex flex-row md:flex-col items-center md:items-start justify-between md:justify-start pr-4 md:border-r md:w-1/4 flex-shrink-0 mb-2 md:mb-0" style={{ borderColor: currentThemeClasses.borderColor.split('-').pop() }}>
              <h3 className="text-xl font-semibold mb-0 md:mb-2">{formatDate(date)}</h3>
              <button
                onClick={() => openAddLessonModal(date)}
                className={`${currentThemeClasses.buttonBg} w-8 h-8 flex items-center justify-center rounded-full text-lg font-bold transition duration-200 ease-in-out transform hover:scale-110`}
                aria-label="Add Lesson"
              >
                +
              </button>
            </div>
            {/* Right Column: Lesson List */}
            <div className="flex-grow md:pl-4">
              <LessonList
                lessons={lessonsByDate[date.toDateString()] || []}
                date={date}
                openEditLessonModal={openEditLessonModal}
                deleteLesson={deleteLesson}
                handleDragEndLesson={handleDragEndLesson}
                droppableId={date.toDateString()}
                isCompact={false} // Full details in list view
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const WeeklyView = ({ weekdays, lessonsByDate, openAddLessonModal, openEditLessonModal, deleteLesson, handleDragEndLesson }) => {
  const { currentThemeClasses } = React.useContext(AppContext);

  // Group weekdays into weeks (Monday to Friday)
  const weeks = [];
  let currentWeek = [];
  for (let i = 0; i < weekdays.length; i++) {
    currentWeek.push(weekdays[i]);
    if (currentWeek.length === 5 || i === weekdays.length - 1) { // A full week or end of days
      weeks.push(currentWeek);
      currentWeek = [];
    } else if (weekdays[i + 1] && weekdays[i + 1].getDay() === 1) { // Next day is Monday, start new week
      weeks.push(currentWeek);
      currentWeek = [];
    }
  }

  return (
    <div className="space-y-8">
      {weeks.length === 0 && (
        <p className="text-center text-gray-500">Please set a date range for this unit.</p>
      )}
      {weeks.map((week, weekIndex) => (
        <div key={weekIndex} className={`p-4 rounded-lg shadow-md border ${currentThemeClasses.borderColor}`}>
          <h3 className="text-xl font-bold mb-4">Week of {formatDate(week[0])} - {formatDate(week[week.length - 1])}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-5 gap-2"> {/* Adjusted for 5 columns */}
            {week.map((date) => (
              <div key={date.toDateString()} className={`p-3 rounded-lg border ${currentThemeClasses.borderColor} ${currentThemeClasses.secondaryBg} min-h-[200px]`}> {/* Increased min-height */}
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-semibold">{formatDate(date)}</h4>
                  <button
                    onClick={() => openAddLessonModal(date)}
                    className={`${currentThemeClasses.buttonBg} w-6 h-6 flex items-center justify-center rounded-full text-sm font-bold transition duration-200 ease-in-out transform hover:scale-110`}
                    aria-label="Add Lesson"
                  >
                    +
                  </button>
                </div>
                <LessonList
                  lessons={lessonsByDate[date.toDateString()] || []}
                  date={date}
                  openEditLessonModal={openEditLessonModal}
                  deleteLesson={deleteLesson}
                  handleDragEndLesson={handleDragEndLesson}
                  droppableId={date.toDateString()}
                  isCompact={false} // Display full details in weekly view
                />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

const MonthlyView = ({ lessons, selectedUnitId, openAddLessonModal, openEditLessonModal, deleteLesson, handleDragEndLesson }) => {
  const { currentThemeClasses } = React.useContext(AppContext);
  const [currentMonth, setCurrentMonth] = React.useState(new Date());

  const daysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year, month) => new Date(year, month, 1).getDay(); // 0 for Sunday, 1 for Monday

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const numDays = daysInMonth(year, month);
  const startDay = firstDayOfMonth(year, month); // Day of week for the 1st of the month

  const days = [];
  // Add empty cells for days before the 1st of the month
  for (let i = 0; i < (startDay === 0 ? 6 : startDay - 1); i++) { // Adjust for Sunday being 0
    days.push(null);
  }
  // Add actual days of the month
  for (let i = 1; i <= numDays; i++) {
    days.push(new Date(year, month, i));
  }

  const lessonsByDate = lessons.filter(l => l.unitId === selectedUnitId).reduce((acc, lesson) => {
    const date = new Date(lesson.date);
    const dateString = date.toDateString(); // Use toDateString as key for consistency with droppableId
    if (!acc[dateString]) {
      acc[dateString] = [];
    }
    acc[dateString].push(lesson);
    return acc;
  }, {});

  const changeMonth = (offset) => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev);
      newMonth.setMonth(prev.getMonth() + offset);
      return newMonth;
    });
  };

  return (
    <div className={`p-4 rounded-lg shadow-md border ${currentThemeClasses.borderColor}`}>
      <div className="flex justify-between items-center mb-4">
        <button
          onClick={() => changeMonth(-1)}
          className={`${currentThemeClasses.buttonBg} px-3 py-1 rounded-xl font-semibold`}
        >
          &lt; Prev
        </button>
        <h3 className="text-xl font-bold">
          {currentMonth.toLocaleString('en-US', { month: 'long', year: 'numeric' })}
        </h3>
        <button
          onClick={() => changeMonth(1)}
          className={`${currentThemeClasses.buttonBg} px-3 py-1 rounded-xl font-semibold`}
        >
          Next &gt;
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center font-semibold mb-2">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
          <div key={day} className="py-2">{day}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((date, index) => (
          <div
            key={index}
            className={`min-h-[180px] p-1 border ${currentThemeClasses.borderColor} rounded-lg flex flex-col ${date ? currentThemeClasses.secondaryBg : 'bg-gray-100'}`} // Increased min-height
          >
            {date ? (
              <>
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold text-sm">{date.getDate()}</span>
                  {date.getDay() !== 0 && date.getDay() !== 6 && ( // Only add for weekdays
                    <button
                      onClick={() => openAddLessonModal(date)}
                      className={`${currentThemeClasses.buttonBg} w-5 h-5 flex items-center justify-center rounded-full text-xs font-bold transition duration-200 ease-in-out transform hover:scale-110`}
                      aria-label="Add Lesson"
                    >
                      +
                    </button>
                  )}
                </div>
                {date.getDay() !== 0 && date.getDay() !== 6 && ( // Only show lessons for weekdays
                  <LessonList
                    lessons={lessonsByDate[date.toDateString()] || []}
                    date={date}
                    openEditLessonModal={openEditLessonModal}
                    deleteLesson={deleteLesson}
                    handleDragEndLesson={handleDragEndLesson}
                    droppableId={date.toDateString()}
                    isCompact={false} // Display full details in calendar view
                  />
                )}
              </>
            ) : (
              <div className="h-full"></div> // Empty cell
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// Lesson List Component (Draggable Lessons)
const LessonList = ({ lessons, date, openEditLessonModal, deleteLesson, handleDragEndLesson, droppableId, isCompact = false }) => {
  const { currentThemeClasses } = React.useContext(AppContext);
  const dragItem = React.useRef(null); // Stores the ID of the lesson being dragged
  const dragSourceDate = React.useRef(null); // Stores the date string of the source droppable
  const dragOverIndex = React.useRef(null); // Stores the index of the item being dragged over

  const handleDragStart = (e, lessonId, index) => {
    dragItem.current = lessonId;
    dragSourceDate.current = date.toDateString();
    e.dataTransfer.setData("lessonId", lessonId);
    e.dataTransfer.setData("sourceDate", date.toDateString());
    e.dataTransfer.setData("sourceIndex", index); // Pass original index for reordering within same list
  };

  const handleDragEnter = (e, index) => {
    e.preventDefault(); // Allow drop
    dragOverIndex.current = index;
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const draggedLessonId = e.dataTransfer.getData("lessonId");
    const sourceDateString = e.dataTransfer.getData("sourceDate");
    const sourceIndex = parseInt(e.dataTransfer.getData("sourceIndex"), 10);
    const destinationDate = date; // This is a Date object

    // Determine the correct destination index based on where the drag ended
    let destinationIndex = lessons.length; // Default to end of list
    if (dragOverIndex.current !== null && dragOverIndex.current < lessons.length) {
        destinationIndex = dragOverIndex.current;
    }

    if (!draggedLessonId || !sourceDateString) return;

    handleDragEndLesson(draggedLessonId, sourceDateString, destinationDate, destinationIndex);

    dragItem.current = null;
    dragSourceDate.current = null;
    dragOverIndex.current = null;
  };

  const handleDragOver = (e) => {
    e.preventDefault(); // Necessary to allow dropping
  };

  return (
    <div
      className={`min-h-[50px] ${isCompact ? 'space-y-0.5' : 'space-y-2'}`}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      data-droppable-id={droppableId}
    >
      {lessons.length === 0 && !isCompact && (
        <p className="text-gray-500 text-sm italic">No lessons planned for this date.</p>
      )}
      {lessons.map((lesson, index) => (
        <div
          key={lesson.id}
          className={`p-2 rounded-lg shadow-sm cursor-grab
            ${lesson.isGraded ? `${currentThemeClasses.gradedBg} ${currentThemeClasses.gradedBorder} border-2` : `${currentThemeClasses.secondaryBg} border ${currentThemeClasses.borderColor}`}
            ${currentThemeClasses.hoverBg}
            ${isCompact ? 'text-xs' : ''}`}
          draggable
          onDragStart={(e) => handleDragStart(e, lesson.id, index)}
          onDragEnter={(e) => handleDragEnter(e, index)}
          onDragEnd={() => { dragItem.current = null; dragSourceDate.current = null; dragOverIndex.current = null; }}
          onDragOver={(e) => e.preventDefault()}
        >
          <div className="flex justify-between items-center">
            <span className="font-medium truncate">{lesson.title}</span>
            <div className="flex space-x-1">
              <button
                onClick={() => openEditLessonModal(lesson)}
                className="text-blue-500 hover:text-blue-700 text-sm"
                aria-label="Edit Lesson"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </button>
              <button
                onClick={() => deleteLesson(lesson.id)}
                className="text-red-500 hover:text-red-700 text-sm"
                aria-label="Delete Lesson"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
          {/* Display more details if not in compact mode */}
          {!isCompact && (
            <div className="text-gray-600 text-sm mt-1">
              {lesson.activityAssignment && <p className="truncate">Activity: {lesson.activityAssignment}</p>}
              {lesson.readings && <p className="truncate">Readings: {lesson.readings}</p>}
              {lesson.googleSlidesLink && <p><a href={lesson.googleSlidesLink} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline truncate">Slides Link</a></p>}
              {lesson.additionalLinks && <p className="truncate">Links: {lesson.additionalLinks}</p>}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

// Modals
const Modal = ({ onClose, children }) => {
  const { currentThemeClasses } = React.useContext(AppContext);
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`${currentThemeClasses.secondaryBg} p-6 rounded-xl shadow-2xl max-w-lg w-full relative`}>
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 text-2xl font-bold"
          aria-label="Close modal"
        >
          &times;
        </button>
        {children}
      </div>
    </div>
  );
};

const AddUnitForm = ({ onAdd, onClose }) => {
  const { currentThemeClasses, showAppMessage } = React.useContext(AppContext);
  const [unitName, setUnitName] = React.useState('');
  const [startDate, setStartDate] = React.useState('');
  const [endDate, setEndDate] = React.useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!unitName.trim()) {
      showAppMessage('Unit name cannot be empty.', 'error');
      return;
    }
    // Pass Date objects to onAdd, which will convert to YYYY-MM-DD for storage
    onAdd(unitName, startDate ? new Date(startDate + 'T00:00:00') : null, endDate ? new Date(endDate + 'T00:00:00') : null);
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="text-2xl font-bold mb-4">Add New Unit</h2>
      <div>
        <label htmlFor="unitName" className="block text-sm font-medium mb-1">Unit Title:</label>
        <input
          type="text"
          id="unitName"
          value={unitName}
          onChange={(e) => setUnitName(e.target.value)}
          className={`w-full p-2 rounded ${currentThemeClasses.inputBorder} ${currentThemeClasses.secondaryBg} ${currentThemeClasses.textColor}`}
          required
        />
      </div>
      <div>
        <label htmlFor="unitStartDate" className="block text-sm font-medium mb-1">Start Date (Optional):</label>
        <input
          type="date"
          id="unitStartDate"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className={`w-full p-2 rounded ${currentThemeClasses.inputBorder} ${currentThemeClasses.secondaryBg} ${currentThemeClasses.textColor}`}
        />
      </div>
      <div>
        <label htmlFor="unitEndDate" className="block text-sm font-medium mb-1">End Date (Optional):</label>
        <input
          type="date"
          id="unitEndDate"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className={`w-full p-2 rounded ${currentThemeClasses.inputBorder} ${currentThemeClasses.secondaryBg} ${currentThemeClasses.textColor}`}
        />
      </div>
      <div className="flex justify-end space-x-2">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-100 transition duration-200 ease-in-out"
        >
          Cancel
        </button>
        <button
          type="submit"
          className={`${currentThemeClasses.buttonBg} px-4 py-2 rounded-xl font-semibold shadow-md transition duration-300 ease-in-out transform hover:scale-105`}
        >
          Add Unit
        </button>
      </div>
    </form>
  );
};

const LessonForm = ({ onSave, onClose, initialData = {} }) => {
  const { currentThemeClasses, showAppMessage } = React.useContext(AppContext);
  const [title, setTitle] = React.useState(initialData.title || '');
  const [googleSlidesLink, setGoogleSlidesLink] = React.useState(initialData.googleSlidesLink || '');
  const [activityAssignment, setActivityAssignment] = React.useState(initialData.activityAssignment || '');
  const [isGraded, setIsGraded] = React.useState(initialData.isGraded || false);
  const [readings, setReadings] = React.useState(initialData.readings || '');
  const [additionalLinks, setAdditionalLinks] = React.useState(initialData.additionalLinks || '');
  // lessonDate state should hold the YYYY-MM-DD string for the input value
  const [lessonDate, setLessonDate] = React.useState(initialData.date || '');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) {
      showAppMessage('Lesson title cannot be empty.', 'error');
      return;
    }

    const dataToSave = {
      title,
      googleSlidesLink,
      activityAssignment,
      isGraded,
      readings,
      additionalLinks,
      date: lessonDate, // Pass the YYYY-MM-DD string directly
    };
    onSave(dataToSave);
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="text-2xl font-bold mb-4">{initialData.id ? 'Edit Lesson' : 'Add New Lesson'}</h2>
      <div>
        <label htmlFor="lessonTitle" className="block text-sm font-medium mb-1">Lesson Title:</label>
        <input
          type="text"
          id="lessonTitle"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className={`w-full p-2 rounded ${currentThemeClasses.inputBorder} ${currentThemeClasses.secondaryBg} ${currentThemeClasses.textColor}`}
          required
        />
      </div>
      <div>
        <label htmlFor="lessonDate" className="block text-sm font-medium mb-1">Date:</label>
        <input
          type="date"
          id="lessonDate"
          value={lessonDate}
          onChange={(e) => setLessonDate(e.target.value)}
          className={`w-full p-2 rounded ${currentThemeClasses.inputBorder} ${currentThemeClasses.secondaryBg} ${currentThemeClasses.textColor}`}
          required
        />
      </div>
      <div>
        <label htmlFor="googleSlidesLink" className="block text-sm font-medium mb-1">Google Slides Link:</label>
        <input
          type="url"
          id="googleSlidesLink"
          value={googleSlidesLink}
          onChange={(e) => setGoogleSlidesLink(e.target.value)}
          className={`w-full p-2 rounded ${currentThemeClasses.inputBorder} ${currentThemeClasses.secondaryBg} ${currentThemeClasses.textColor}`}
          placeholder="e.g., https://docs.google.com/presentation/d/..."
        />
      </div>
      <div>
        <label htmlFor="activityAssignment" className="block text-sm font-medium mb-1">Activity/Assignment:</label>
        <input
          type="text"
          id="activityAssignment"
          value={activityAssignment}
          onChange={(e) => setActivityAssignment(e.target.value)}
          className={`w-full p-2 rounded ${currentThemeClasses.inputBorder} ${currentThemeClasses.secondaryBg} ${currentThemeClasses.textColor}`}
        />
      </div>
      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="isGraded"
          checked={isGraded}
          onChange={(e) => setIsGraded(e.target.checked)}
          className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
        />
        <label htmlFor="isGraded" className="text-sm font-medium">Graded Assignment</label>
      </div>
      <div>
        <label htmlFor="readings" className="block text-sm font-medium mb-1">Readings:</label>
        <textarea
          id="readings"
          value={readings}
          onChange={(e) => setReadings(e.target.value)}
          className={`w-full p-2 rounded ${currentThemeClasses.inputBorder} ${currentThemeClasses.secondaryBg} ${currentThemeClasses.textColor}`}
          rows="2"
        ></textarea>
      </div>
      <div>
        <label htmlFor="additionalLinks" className="block text-sm font-medium mb-1">Additional Links (comma-separated):</label>
        <textarea
          id="additionalLinks"
          value={additionalLinks}
          onChange={(e) => setAdditionalLinks(e.target.value)}
          className={`w-full p-2 rounded ${currentThemeClasses.inputBorder} ${currentThemeClasses.secondaryBg} ${currentThemeClasses.textColor}`}
          rows="2"
        ></textarea>
      </div>
      <div className="flex justify-end space-x-2">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-100 transition duration-200 ease-in-out"
        >
          Cancel
        </button>
        <button
          type="submit"
          className={`${currentThemeClasses.buttonBg} px-4 py-2 rounded-xl font-semibold shadow-md transition duration-300 ease-in-out transform hover:scale-105`}
        >
          {initialData.id ? 'Save Changes' : 'Add Lesson'}
        </button>
      </div>
    </form>
  );
};

const ConfirmDeleteUnitModal = ({ unit, onConfirm, onClose }) => {
  const { currentThemeClasses } = React.useContext(AppContext);
  return (
    <div className="space-y-4 text-center">
      <h2 className="text-xl font-bold">Confirm Deletion</h2>
      <p>Are you sure you want to delete the unit "<span className="font-semibold">{unit.name}</span>"?</p>
      <p className="text-red-600 font-semibold">This action cannot be undone.</p>
      <div className="flex justify-center space-x-4 mt-6">
        <button
          onClick={onClose}
          className="px-6 py-2 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-100 transition duration-200 ease-in-out"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-xl font-semibold shadow-md transition duration-300 ease-in-out transform hover:scale-105"
        >
          Delete
        </button>
      </div>
    </div>
  );
};

// Render the App component into the root div
// Ensure ReactDOM is accessed from the global scope
(function() {
  document.addEventListener('DOMContentLoaded', function() {
    const rootElement = document.getElementById('root');

    // Robust check for ReactDOM and React availability
    if (typeof window.ReactDOM === 'undefined' || typeof window.React === 'undefined') {
      console.error("React or ReactDOM not loaded. Please ensure CDN scripts are correctly linked.");
      return;
    }

    let rootInstance;
    // Check if root has already been created (e.g., in a development environment that re-executes scripts)
    // This is to prevent the "createRoot() on a container that has already been passed to createRoot()" warning.
    if (rootElement._reactRootContainer) {
      rootInstance = rootElement._reactRootContainer; // Access existing root
    } else {
      try {
        // Prioritize direct access to createRoot, then fallback to .default
        if (typeof window.ReactDOM.createRoot === 'function') {
          rootInstance = window.ReactDOM.createRoot(rootElement);
        } else if (window.ReactDOM.default && typeof window.ReactDOM.default.createRoot === 'function') {
          rootInstance = window.ReactDOM.default.createRoot(rootElement);
        } else {
          console.error("ReactDOM.createRoot not found. Check ReactDOM CDN version and availability.");
          return;
        }
      } catch (e) {
        console.error("Error creating React root:", e);
        return;
      }
    }

    // Render the app
    rootInstance.render(window.React.createElement(App, null));
  });
})();
