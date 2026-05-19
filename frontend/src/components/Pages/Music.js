import React from 'react';
import { useMusic } from '../../context/MusicContext';
import Header from '../Layout/Header';
import Footer from '../Layout/Footer';
import MusicUpload from '../music/MusicUpload';
import Playlist from '../music/Playlist';

const MusicPage = () => {
  const { playlistRef, playTrack, refreshPlaylists } = useMusic();

  const handleUpload = () => {
    refreshPlaylists();
  };

  return (
    <>
      <Header />
      <div className="pm-container bg-white dark:bg-gray-900 shadow-xl rounded-2xl p-8 max-w-3xl mx-auto my-8 animate-fade-in">
        <h1 className="text-3xl font-bold mb-4">Music</h1>
        <MusicUpload onUpload={handleUpload} />
        <div className="mt-8">
          <Playlist 
            ref={playlistRef}
            onSelectTrack={track => {
              playTrack(track);
            }} 
          />
        </div>
      </div>
      <Footer />
    </>
  );
};

export default MusicPage;
