import React, { createContext, useContext, useState, useCallback } from 'react';
import { API_URLS } from '../config/api';

const WikiContext = createContext(null);

export const useWiki = () => {
  const context = useContext(WikiContext);
  if (!context) {
    throw new Error('useWiki must be used within a WikiProvider');
  }
  return context;
};

export const WikiProvider = ({ children }) => {
  const [wikis, setWikis] = useState({ owned: [], team: [], public: [] });
  const [currentWiki, setCurrentWiki] = useState(null);
  const [currentPage, setCurrentPage] = useState(null);
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [permissions, setPermissions] = useState(null);

  const fetchWikis = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(API_URLS.WIKIS, {
        credentials: 'include'
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to fetch wikis');
      }
      const data = await response.json();
      setWikis(data);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPublicWikis = useCallback(async (page = 1) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URLS.WIKIS_PUBLIC}?page=${page}`, {
        credentials: 'include'
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to fetch public wikis');
      }
      const data = await response.json();
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const createWiki = useCallback(async (wikiData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(API_URLS.WIKIS, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(wikiData)
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create wiki');
      }
      const data = await response.json();
      await fetchWikis();
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchWikis]);

  const getWiki = useCallback(async (slug) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URLS.WIKIS}/${slug}`, {
        credentials: 'include'
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to fetch wiki');
      }
      const data = await response.json();
      setCurrentWiki(data.wiki);
      setPermissions(data.permissions || null);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateWiki = useCallback(async (slug, wikiData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URLS.WIKIS}/${slug}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(wikiData)
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update wiki');
      }
      const data = await response.json();
      setCurrentWiki(data.wiki);
      await fetchWikis();
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchWikis]);

  const deleteWiki = useCallback(async (slug) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URLS.WIKIS}/${slug}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete wiki');
      }
      await fetchWikis();
      setCurrentWiki(null);
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchWikis]);

  const fetchPages = useCallback(async (wikiSlug) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URLS.WIKIS}/${wikiSlug}/pages`, {
        credentials: 'include'
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to fetch pages');
      }
      const data = await response.json();
      setPages(data.pages);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getPage = useCallback(async (wikiSlug, pageSlug) => {
    setLoading(true);
    setError(null);
    try {
      console.log('getPage called:', wikiSlug, pageSlug);
      const response = await fetch(`${API_URLS.WIKIS}/${wikiSlug}/pages/${pageSlug}`, {
        credentials: 'include'
      });
      console.log('getPage response status:', response.status);
      if (!response.ok) {
        const data = await response.json();
        console.error('getPage error:', data);
        throw new Error(data.error || 'Failed to fetch page');
      }
      const data = await response.json();
      console.log('getPage success:', data);
      setCurrentPage(data.page);
      return data;
    } catch (err) {
      console.error('getPage exception:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const createPage = useCallback(async (wikiSlug, pageData) => {
    setLoading(true);
    setError(null);
    try {
      console.log('Creating page:', wikiSlug, pageData);
      const response = await fetch(`${API_URLS.WIKIS}/${wikiSlug}/pages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(pageData)
      });
      console.log('Create page response status:', response.status);
      if (!response.ok) {
        const data = await response.json();
        console.error('Create page error response:', data);
        throw new Error(data.error || 'Failed to create page');
      }
      const data = await response.json();
      console.log('Create page success:', data);
      await fetchPages(wikiSlug);
      return data;
    } catch (err) {
      console.error('Create page exception:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchPages]);

  const updatePage = useCallback(async (wikiSlug, pageSlug, pageData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URLS.WIKIS}/${wikiSlug}/pages/${pageSlug}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(pageData)
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update page');
      }
      const data = await response.json();
      setCurrentPage(data.page);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deletePage = useCallback(async (wikiSlug, pageSlug) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URLS.WIKIS}/${wikiSlug}/pages/${pageSlug}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete page');
      }
      await fetchPages(wikiSlug);
      setCurrentPage(null);
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchPages]);

  const getPageHistory = useCallback(async (wikiSlug, pageSlug, page = 1) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URLS.WIKIS}/${wikiSlug}/pages/${pageSlug}/history?page=${page}`, {
        credentials: 'include'
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to fetch history');
      }
      const data = await response.json();
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getDiff = useCallback(async (wikiSlug, pageSlug, v1, v2) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URLS.WIKIS}/${wikiSlug}/pages/${pageSlug}/diff?v1=${v1}&v2=${v2}`, {
        credentials: 'include'
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to fetch diff');
      }
      const data = await response.json();
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const restoreVersion = useCallback(async (wikiSlug, pageSlug, versionId) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URLS.WIKIS}/${wikiSlug}/pages/${pageSlug}/restore/${versionId}`, {
        method: 'POST',
        credentials: 'include'
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to restore version');
      }
      const data = await response.json();
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const searchWiki = useCallback(async (wikiSlug, query) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URLS.WIKIS}/${wikiSlug}/pages/search?q=${encodeURIComponent(query)}`, {
        credentials: 'include'
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Search failed');
      }
      const data = await response.json();
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getBacklinks = useCallback(async (wikiSlug, pageSlug) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URLS.WIKIS}/${wikiSlug}/pages/${pageSlug}/backlinks`, {
        credentials: 'include'
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to fetch backlinks');
      }
      const data = await response.json();
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getCategories = useCallback(async (wikiSlug) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URLS.WIKIS}/${wikiSlug}/pages/categories`, {
        credentials: 'include'
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to fetch categories');
      }
      const data = await response.json();
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const createCategory = useCallback(async (wikiSlug, categoryData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URLS.WIKIS}/${wikiSlug}/pages/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(categoryData)
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create category');
      }
      const data = await response.json();
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const movePage = useCallback(async (wikiSlug, pageSlug, newTitle, newParentId = null) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URLS.WIKIS}/${wikiSlug}/pages/${pageSlug}/move`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ newTitle, newParentId })
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to move page');
      }
      const data = await response.json();
      await fetchPages(wikiSlug);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchPages]);

  const addToWatchlist = useCallback(async (wikiSlug, pageSlug) => {
    setError(null);
    try {
      const response = await fetch(`${API_URLS.WIKIS}/${wikiSlug}/pages/${pageSlug}/watch`, {
        method: 'POST',
        credentials: 'include'
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to add to watchlist');
      }
      return await response.json();
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  const removeFromWatchlist = useCallback(async (wikiSlug, pageSlug) => {
    setError(null);
    try {
      const response = await fetch(`${API_URLS.WIKIS}/${wikiSlug}/pages/${pageSlug}/watch`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to remove from watchlist');
      }
      return await response.json();
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  const getWatchlist = useCallback(async (wikiSlug = null) => {
    setLoading(true);
    setError(null);
    try {
      const url = wikiSlug 
        ? `${API_URLS.WIKIS}/${wikiSlug}/pages/watchlist`
        : `${API_URLS.WIKIS}/public/pages/watchlist`;
      const response = await fetch(url, { credentials: 'include' });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to fetch watchlist');
      }
      return await response.json();
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getRecentChanges = useCallback(async (wikiSlug) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URLS.WIKIS}/${wikiSlug}/pages/recent-changes`, {
        credentials: 'include'
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to fetch recent changes');
      }
      return await response.json();
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getAllPages = useCallback(async (wikiSlug, sort = 'title', order = 'asc') => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URLS.WIKIS}/${wikiSlug}/pages/all?sort=${sort}&order=${order}`, {
        credentials: 'include'
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to fetch pages');
      }
      return await response.json();
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const value = {
    wikis,
    currentWiki,
    currentPage,
    pages,
    loading,
    error,
    permissions,
    fetchWikis,
    fetchPublicWikis,
    createWiki,
    getWiki,
    updateWiki,
    deleteWiki,
    fetchPages,
    getPage,
    createPage,
    updatePage,
    deletePage,
    getPageHistory,
    getDiff,
    restoreVersion,
    searchWiki,
    getBacklinks,
    getCategories,
    createCategory,
    movePage,
    addToWatchlist,
    removeFromWatchlist,
    getWatchlist,
    getRecentChanges,
    getAllPages,
    setCurrentWiki,
    setCurrentPage
  };

  return (
    <WikiContext.Provider value={value}>
      {children}
    </WikiContext.Provider>
  );
};

export default WikiContext;
