
import React, { useState, useEffect } from 'react';
import { AppState, Notebook, Page, NOTEBOOK_COLORS, Theme } from './types';
import { loadState, saveState, createNewNotebook, createNewPage } from './services/storage';
import { Icons } from './components/Icon';
import { PageView } from './components/PageView';

enum ViewMode {
  DASHBOARD = 'DASHBOARD',
  NOTEBOOK = 'NOTEBOOK'
}

function App() {
  const [state, setState] = useState<AppState>({ notebooks: [], pages: {}, theme: 'system' });
  const [view, setView] = useState<ViewMode>(ViewMode.DASHBOARD);
  const [activeNotebookId, setActiveNotebookId] = useState<string | null>(null);
  const [activePageId, setActivePageId] = useState<string | null>(null);
  
  // View State
  const [isReadMode, setIsReadMode] = useState(false);

  // History State
  const [history, setHistory] = useState<{ past: Page[]; future: Page[] }>({ past: [], future: [] });

  // New Notebook Modal State
  const [showNewModal, setShowNewModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newSubject, setNewSubject] = useState('');
  const [newColor, setNewColor] = useState(NOTEBOOK_COLORS[0]);

  // Load state on mount
  useEffect(() => {
    const loaded = loadState();
    setState(loaded);
  }, []);

  // Save state on change
  useEffect(() => {
    if (state.notebooks.length > 0) {
        saveState(state);
    }
  }, [state]);

  // Reset history when switching pages
  useEffect(() => {
    setHistory({ past: [], future: [] });
  }, [activePageId]);

  // Handle Theme Changes
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');

    if (state.theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.add(systemTheme);
    } else {
      root.classList.add(state.theme);
    }
  }, [state.theme]);

  const setTheme = (theme: Theme) => {
    setState(prev => ({ ...prev, theme }));
  };

  const handleOpenNotebook = (id: string) => {
    const notebook = state.notebooks.find(n => n.id === id);
    if (!notebook) return;
    
    setActiveNotebookId(id);
    
    // Open first page or create one if none
    if (notebook.pageOrder.length > 0) {
      setActivePageId(notebook.pageOrder[0]);
    } else {
      const newPage = createNewPage(id, 1);
      const updatedNotebook = { ...notebook, pageOrder: [newPage.id] };
      setState(prev => ({
        ...prev,
        notebooks: prev.notebooks.map(n => n.id === id ? updatedNotebook : n),
        pages: { ...prev.pages, [newPage.id]: newPage }
      }));
      setActivePageId(newPage.id);
    }
    setView(ViewMode.NOTEBOOK);
    setIsReadMode(false); // Default to write mode when opening
  };

  const handleCreateNotebook = () => {
    if (!newTitle.trim()) return;
    const notebook = createNewNotebook(newTitle, newSubject, newColor);
    const firstPage = createNewPage(notebook.id, 1);
    notebook.pageOrder.push(firstPage.id);
    
    setState(prev => ({
      ...prev,
      notebooks: [...prev.notebooks, notebook],
      pages: { ...prev.pages, [firstPage.id]: firstPage }
    }));
    
    setShowNewModal(false);
    setNewTitle('');
    setNewSubject('');
    setNewColor(NOTEBOOK_COLORS[0]);
  };

  const handleDeleteNotebook = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if(window.confirm('Are you sure you want to delete this notebook?')) {
      setState(prev => ({
        ...prev,
        notebooks: prev.notebooks.filter(n => n.id !== id)
      }));
    }
  };

  // Helper to update state without touching history
  const updatePageStateOnly = (page: Page) => {
    setState(prev => ({
      ...prev,
      pages: { ...prev.pages, [page.id]: page }
    }));
  };

  // Main update handler - records history
  const handleUpdatePage = (updatedPage: Page) => {
    // Save current state to history before updating
    const currentPage = state.pages[updatedPage.id];
    setHistory(prev => ({
        past: [...prev.past, currentPage].slice(-50), // Keep last 50 states
        future: []
    }));

    updatePageStateOnly(updatedPage);
  };

  const handleUndo = () => {
    if (history.past.length === 0) return;

    const previousPage = history.past[history.past.length - 1];
    const newPast = history.past.slice(0, -1);
    const currentPage = state.pages[previousPage.id]; // This is the state we are undoing FROM

    setHistory({
        past: newPast,
        future: [currentPage, ...history.future]
    });

    updatePageStateOnly(previousPage);
  };

  const handleRedo = () => {
    if (history.future.length === 0) return;

    const nextPage = history.future[0];
    const newFuture = history.future.slice(1);
    const currentPage = state.pages[nextPage.id];

    setHistory(prev => ({
        past: [...prev.past, currentPage],
        future: newFuture
    }));

    updatePageStateOnly(nextPage);
  };

  const handlePrevPage = () => {
    if (!activeNotebookId || !activePageId) return;
    const notebook = state.notebooks.find(n => n.id === activeNotebookId);
    if (!notebook) return;
    const idx = notebook.pageOrder.indexOf(activePageId);
    if (idx > 0) setActivePageId(notebook.pageOrder[idx - 1]);
  };

  const handleNextPage = () => {
    if (!activeNotebookId || !activePageId) return;
    const notebook = state.notebooks.find(n => n.id === activeNotebookId);
    if (!notebook) return;
    const idx = notebook.pageOrder.indexOf(activePageId);
    
    if (idx < notebook.pageOrder.length - 1) {
      setActivePageId(notebook.pageOrder[idx + 1]);
    } else {
      // Create new page
      const newPageNumber = notebook.pageOrder.length + 1;
      const newPage = createNewPage(activeNotebookId, newPageNumber);
      const updatedNotebook = { ...notebook, pageOrder: [...notebook.pageOrder, newPage.id] };
      
      setState(prev => ({
        ...prev,
        notebooks: prev.notebooks.map(n => n.id === activeNotebookId ? updatedNotebook : n),
        pages: { ...prev.pages, [newPage.id]: newPage }
      }));
      setActivePageId(newPage.id);
    }
  };

  const ThemeToggle = () => (
    <div className="flex bg-gray-200 dark:bg-gray-700 rounded-lg p-1">
      <button 
        onClick={() => setTheme('light')}
        className={`p-1.5 rounded-md transition-all ${state.theme === 'light' ? 'bg-white dark:bg-gray-600 shadow text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'}`}
        title="Light Mode"
      >
        <Icons.Sun size={16} />
      </button>
      <button 
        onClick={() => setTheme('system')}
        className={`p-1.5 rounded-md transition-all ${state.theme === 'system' ? 'bg-white dark:bg-gray-600 shadow text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'}`}
        title="System Default"
      >
        <Icons.Monitor size={16} />
      </button>
      <button 
        onClick={() => setTheme('dark')}
        className={`p-1.5 rounded-md transition-all ${state.theme === 'dark' ? 'bg-white dark:bg-gray-600 shadow text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'}`}
        title="Dark Mode"
      >
        <Icons.Moon size={16} />
      </button>
    </div>
  );

  // Render Dashboard
  if (view === ViewMode.DASHBOARD) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-8 font-sans transition-colors duration-200">
        <header className="max-w-6xl mx-auto mb-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
                <h1 className="text-4xl font-bold text-gray-800 dark:text-white tracking-tight">My Bookshelf</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-2">Select a subject to start studying</p>
            </div>
            <div className="flex items-center gap-4">
                <ThemeToggle />
                <button 
                    onClick={() => setShowNewModal(true)}
                    className="bg-black dark:bg-blue-600 text-white px-6 py-3 rounded-full hover:bg-gray-800 dark:hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-lg font-medium"
                >
                    <Icons.Plus size={20} /> <span className="hidden sm:inline">New Notebook</span>
                </button>
            </div>
        </header>

        <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 pb-20">
            {state.notebooks.map(notebook => (
                <div 
                    key={notebook.id}
                    onClick={() => handleOpenNotebook(notebook.id)}
                    className="group relative cursor-pointer perspective-1000"
                >
                    {/* Notebook Cover Visual */}
                    <div className={`
                        ${notebook.coverColor} 
                        aspect-[3/4] rounded-r-lg rounded-l-sm shadow-xl dark:shadow-black/50
                        transition-all transform group-hover:-translate-y-2 group-hover:shadow-2xl
                        flex flex-col justify-between p-6 relative overflow-hidden
                        before:absolute before:left-0 before:top-0 before:bottom-0 before:w-4 before:bg-black/10 before:z-10
                    `}>
                        <div className="z-20 text-white">
                            <h3 className="font-comic text-2xl font-bold leading-tight break-words mb-2">{notebook.title}</h3>
                            <span className="inline-block bg-white/20 px-2 py-1 rounded text-xs backdrop-blur-sm font-medium uppercase tracking-wider">{notebook.subject}</span>
                        </div>
                        
                        <div className="z-20 border-t border-white/20 pt-4 mt-auto">
                            <p className="text-white/80 text-xs font-mono">{new Date(notebook.createdAt).toLocaleDateString()}</p>
                            <p className="text-white/80 text-xs font-mono mt-1">{notebook.pageOrder.length} Pages</p>
                        </div>

                        {/* Visual texture */}
                        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none"></div>
                    </div>

                    <button 
                        onClick={(e) => handleDeleteNotebook(e, notebook.id)}
                        className="absolute -top-2 -right-2 bg-white dark:bg-gray-800 text-red-500 p-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-30 hover:bg-red-50 dark:hover:bg-gray-700"
                        title="Delete Notebook"
                    >
                        <Icons.Trash size={16} />
                    </button>
                </div>
            ))}
            
            {state.notebooks.length === 0 && (
              <div className="col-span-full text-center py-20 opacity-50">
                <div className="mx-auto w-24 h-24 bg-gray-200 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                  <Icons.Book size={40} className="text-gray-400 dark:text-gray-500" />
                </div>
                <p className="text-xl text-gray-500 dark:text-gray-400">Your bookshelf is empty.</p>
                <p className="text-gray-400 dark:text-gray-500">Create a notebook to get started.</p>
              </div>
            )}
        </div>

        {/* Create Modal */}
        {showNewModal && (
            <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm p-4">
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 w-full max-w-md shadow-2xl transform transition-all border dark:border-gray-700">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold dark:text-white">New Notebook</h2>
                        <button onClick={() => setShowNewModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"><Icons.Close /></button>
                    </div>
                    
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title</label>
                            <input 
                                type="text" 
                                value={newTitle}
                                onChange={(e) => setNewTitle(e.target.value)}
                                placeholder="e.g. Advanced Chemistry"
                                className="w-full border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 p-2 border bg-white dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
                                autoFocus
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Subject</label>
                            <input 
                                type="text" 
                                value={newSubject}
                                onChange={(e) => setNewSubject(e.target.value)}
                                placeholder="e.g. Science"
                                className="w-full border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 p-2 border bg-white dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Cover Color</label>
                            <div className="grid grid-cols-5 gap-2">
                                {NOTEBOOK_COLORS.map(c => (
                                    <button
                                        key={c}
                                        onClick={() => setNewColor(c)}
                                        className={`w-8 h-8 rounded-full ${c} ${newColor === c ? 'ring-2 ring-offset-2 ring-black dark:ring-white' : ''}`}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 flex gap-3">
                        <button onClick={() => setShowNewModal(false)} className="flex-1 py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 font-medium dark:text-gray-300">Cancel</button>
                        <button onClick={handleCreateNotebook} className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium shadow-md">Create Notebook</button>
                    </div>
                </div>
            </div>
        )}
      </div>
    );
  }

  // Render Notebook View
  const activeNotebook = state.notebooks.find(n => n.id === activeNotebookId);
  const activePage = activePageId ? state.pages[activePageId] : null;

  if (!activeNotebook || !activePage) return <div className="dark:bg-gray-900 dark:text-white h-screen flex items-center justify-center">Loading...</div>;

  return (
    <div className="h-screen flex flex-col bg-gray-100 dark:bg-gray-900 font-sans overflow-hidden transition-colors duration-200">
        {/* Top Navbar */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between shadow-sm z-20">
            <div className="flex items-center gap-4">
                <button 
                    onClick={() => setView(ViewMode.DASHBOARD)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-600 dark:text-gray-300 transition-colors flex items-center gap-2"
                >
                    <Icons.Grid size={20} />
                    <span className="hidden sm:inline font-medium">Dashboard</span>
                </button>
                <div className="h-6 w-px bg-gray-300 dark:bg-gray-600 mx-2"></div>
                <div>
                    <h2 className="font-bold text-lg leading-none dark:text-white">{activeNotebook.title}</h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{activeNotebook.subject}</p>
                </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-4">
                
                {/* Read/Write Toggle */}
                 <button 
                    onClick={() => setIsReadMode(!isReadMode)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors border ${
                        isReadMode 
                        ? 'bg-blue-100 border-blue-200 text-blue-700 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-300' 
                        : 'bg-gray-100 border-gray-200 text-gray-700 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200'
                    }`}
                >
                    {isReadMode ? <Icons.Eye size={16} /> : <Icons.Edit size={16} />}
                    <span className="hidden sm:inline">{isReadMode ? 'Read Mode' : 'Write Mode'}</span>
                </button>

                <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1"></div>

                {/* History Controls */}
                <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-1 mr-2">
                    <button 
                        onClick={handleUndo}
                        disabled={history.past.length === 0}
                        className="p-2 hover:bg-white dark:hover:bg-gray-600 rounded-md disabled:opacity-30 disabled:hover:bg-transparent transition-all text-gray-700 dark:text-gray-200"
                        title="Undo"
                    >
                        <Icons.Undo size={18} />
                    </button>
                    <button 
                        onClick={handleRedo}
                        disabled={history.future.length === 0}
                        className="p-2 hover:bg-white dark:hover:bg-gray-600 rounded-md disabled:opacity-30 disabled:hover:bg-transparent transition-all text-gray-700 dark:text-gray-200"
                        title="Redo"
                    >
                        <Icons.Redo size={18} />
                    </button>
                </div>

                <div className="hidden sm:block">
                  <ThemeToggle />
                </div>
                
                <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-1 text-gray-700 dark:text-gray-200">
                    <button 
                        onClick={handlePrevPage}
                        disabled={activeNotebook.pageOrder.indexOf(activePage.id) === 0}
                        className="p-2 hover:bg-white dark:hover:bg-gray-600 rounded-md disabled:opacity-30 disabled:hover:bg-transparent transition-all"
                    >
                        <Icons.Left size={20} />
                    </button>
                    <span className="px-4 font-mono text-sm font-medium">
                        {activePage.pageNumber} / {activeNotebook.pageOrder.length}
                    </span>
                    <button 
                        onClick={handleNextPage}
                        className="p-2 hover:bg-white dark:hover:bg-gray-600 rounded-md transition-all"
                        title={activeNotebook.pageOrder.indexOf(activePage.id) === activeNotebook.pageOrder.length - 1 ? "New Page" : "Next Page"}
                    >
                        {activeNotebook.pageOrder.indexOf(activePage.id) === activeNotebook.pageOrder.length - 1 ? <Icons.Plus size={20} /> : <Icons.Right size={20} />}
                    </button>
                </div>
            </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto bg-gray-200/50 dark:bg-gray-900 p-4 md:p-8">
            <PageView page={activePage} onUpdatePage={handleUpdatePage} readOnly={isReadMode} />
        </div>
    </div>
  );
}

export default App;
