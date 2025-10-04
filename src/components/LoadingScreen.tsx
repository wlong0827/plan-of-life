const LoadingScreen = () => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <img 
          src="/icon.png" 
          alt="Plan of Life" 
          className="w-24 h-24 animate-pulse"
        />
        <p className="text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
};

export default LoadingScreen;
