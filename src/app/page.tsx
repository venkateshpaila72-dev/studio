"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { NinjaIcon } from "@/components/icons/NinjaIcon";
import { ShurikenIcon } from "@/components/icons/ShurikenIcon";
import { EnemyIcon } from "@/components/icons/EnemyIcon";
import { adjustDifficulty, type AdaptiveDifficultyOutput } from "@/ai/flows/adaptive-difficulty-scaling";
import * as C from "@/lib/constants";

type GameState = "menu" | "playing" | "gameOver";
type Entity = { id: number; x: number; y: number };
type Obstacle = Entity & { width: number; height: number };

export default function Home() {
  const [gameState, setGameState] = useState<GameState>("menu");
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);

  const [playerPos, setPlayerPos] = useState({ y: C.PLAYER_INITIAL_Y });
  const [playerVelocity, setPlayerVelocity] = useState(0);
  const [isJumping, setIsJumping] = useState(false);

  const [shurikens, setShurikens] = useState<Entity[]>([]);
  const [enemies, setEnemies] = useState<Entity[]>([]);
  const [obstacles, setObstacles] = useState<Obstacle[]>([]);
  const [difficulty, setDifficulty] = useState<AdaptiveDifficultyOutput>({
    enemySpawnRate: 1,
    obstacleComplexity: 1,
    gameSpeedMultiplier: 1,
  });
  
  const gameContainerRef = useRef<HTMLDivElement>(null);
  const gameLoopRef = useRef<number>();
  const lastFrameTimeRef = useRef<number>(0);
  const enemySpawnCounterRef = useRef(0);
  const obstacleSpawnCounterRef = useRef(0);

  useEffect(() => {
    setHighScore(Number(localStorage.getItem("shadow-strike-highscore") || 0));
  }, []);

  const resetGame = useCallback(() => {
    setScore(0);
    setPlayerPos({ y: C.PLAYER_INITIAL_Y });
    setPlayerVelocity(0);
    setIsJumping(false);
    setShurikens([]);
    setEnemies([]);
    setObstacles([]);
    setDifficulty({ enemySpawnRate: 1, obstacleComplexity: 1, gameSpeedMultiplier: 1 });
  }, []);

  const startGame = useCallback(() => {
    resetGame();
    setGameState("playing");
    lastFrameTimeRef.current = performance.now();
  }, [resetGame]);

  const handleGameOver = useCallback(() => {
    setGameState("gameOver");
    if (score > highScore) {
      setHighScore(score);
      localStorage.setItem("shadow-strike-highscore", String(score));
    }
    if (gameLoopRef.current) {
      cancelAnimationFrame(gameLoopRef.current);
    }
  }, [score, highScore]);
  
  const gameLoop = useCallback(() => {
    const now = performance.now();
    const deltaTime = (now - lastFrameTimeRef.current);
    lastFrameTimeRef.current = now;

    if (gameState !== "playing") return;

    // Player physics
    setPlayerPos(prev => {
      let newVelocity = playerVelocity + C.GRAVITY * (deltaTime/16);
      let newY = prev.y + newVelocity * (deltaTime/16);
      
      if (newY >= C.PLAYER_INITIAL_Y) {
        newY = C.PLAYER_INITIAL_Y;
        newVelocity = 0;
        setIsJumping(false);
      }
      setPlayerVelocity(newVelocity);
      return { y: newY };
    });

    const gameSpeed = difficulty.gameSpeedMultiplier * (deltaTime / 16);

    // Move shurikens
    setShurikens(prev => prev.map(s => ({ ...s, x: s.x + C.SHURIKEN_SPEED * gameSpeed })).filter(s => s.x < C.GAME_WIDTH));

    // Move enemies
    setEnemies(prev => prev.map(e => ({ ...e, x: e.x - C.GROUND_SPEED * gameSpeed })).filter(e => e.x > -C.ENEMY_WIDTH));

    // Move obstacles
    setObstacles(prev => prev.map(o => ({ ...o, x: o.x - C.GROUND_SPEED * gameSpeed })).filter(o => o.x > -o.width));

    // Spawn enemies
    enemySpawnCounterRef.current += gameSpeed;
    if (enemySpawnCounterRef.current > 300 / difficulty.enemySpawnRate) {
      enemySpawnCounterRef.current = 0;
      setEnemies(prev => [...prev, { id: Date.now(), x: C.GAME_WIDTH, y: C.PLAYER_INITIAL_Y + C.PLAYER_HEIGHT - C.ENEMY_HEIGHT }]);
    }
    
    // Spawn obstacles
    obstacleSpawnCounterRef.current += gameSpeed;
    if (obstacleSpawnCounterRef.current > 400 / difficulty.obstacleComplexity) {
        obstacleSpawnCounterRef.current = 0;
        const height = C.OBSTACLE_MIN_HEIGHT + Math.random() * (C.OBSTACLE_MAX_HEIGHT - C.OBSTACLE_MIN_HEIGHT);
        const width = C.OBSTACLE_MIN_WIDTH + Math.random() * (C.OBSTACLE_MAX_WIDTH - C.OBSTACLE_MIN_WIDTH);
        setObstacles(prev => [...prev, { id: Date.now(), x: C.GAME_WIDTH, y: C.GAME_HEIGHT - C.GROUND_HEIGHT - height, width: width, height: height }]);
    }

    // Collision detection
    const playerRect = { x: C.PLAYER_X_POSITION, y: playerPos.y, width: C.PLAYER_WIDTH, height: C.PLAYER_HEIGHT };

    for (const enemy of enemies) {
      const enemyRect = { x: enemy.x, y: enemy.y, width: C.ENEMY_WIDTH, height: C.ENEMY_HEIGHT };
      if (checkCollision(playerRect, enemyRect)) {
        handleGameOver();
        return;
      }
    }

    for (const obstacle of obstacles) {
      if (checkCollision(playerRect, obstacle)) {
        handleGameOver();
        return;
      }
    }

    const newShurikens = [];
    let newEnemies = [...enemies];
    let scoreToAdd = 0;

    for (const shuriken of shurikens) {
      const shurikenRect = { x: shuriken.x, y: shuriken.y, width: C.SHURIKEN_WIDTH, height: C.SHURIKEN_HEIGHT };
      let shurikenHit = false;
      
      newEnemies = newEnemies.filter(enemy => {
        const enemyRect = { x: enemy.x, y: enemy.y, width: C.ENEMY_WIDTH, height: C.ENEMY_HEIGHT };
        if (checkCollision(shurikenRect, enemyRect)) {
          shurikenHit = true;
          scoreToAdd += C.SCORE_PER_ENEMY;
          return false; // Remove enemy
        }
        return true;
      });

      if (!shurikenHit) {
        newShurikens.push(shuriken);
      }
    }

    if (scoreToAdd > 0) {
      setScore(s => s + scoreToAdd);
      setShurikens(newShurikens);
      setEnemies(newEnemies);
    }
    
    gameLoopRef.current = requestAnimationFrame(gameLoop);
  }, [gameState, playerPos.y, playerVelocity, shurikens, enemies, obstacles, difficulty, handleGameOver]);

  useEffect(() => {
    if (gameState === "playing") {
      gameLoopRef.current = requestAnimationFrame(gameLoop);
    }
    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [gameState, gameLoop]);
  
  useEffect(() => {
    if (gameState !== 'playing') return;
    const difficultyInterval = setInterval(async () => {
        const newDifficulty = await adjustDifficulty({ playerScore: score });
        setDifficulty(newDifficulty);
    }, 5000);
    return () => clearInterval(difficultyInterval);
  }, [gameState, score]);

  const handleJump = () => {
    if (gameState !== "playing" || isJumping) return;
    setIsJumping(true);
    setPlayerVelocity(C.PLAYER_JUMP_VELOCITY);
  };
  
  const handleShoot = () => {
    if (gameState !== "playing") return;
    setShurikens((prev) => [
      ...prev,
      {
        id: Date.now(),
        x: C.PLAYER_X_POSITION + C.PLAYER_WIDTH,
        y: playerPos.y + C.PLAYER_HEIGHT / 2 - C.SHURIKEN_HEIGHT / 2,
      },
    ]);
  };

  function checkCollision(rect1: any, rect2: any) {
    return (
      rect1.x < rect2.x + rect2.width &&
      rect1.x + rect1.width > rect2.x &&
      rect1.y < rect2.y + rect2.height &&
      rect1.y + rect1.height > rect2.y
    );
  }

  const renderGameContent = () => {
    switch (gameState) {
      case "menu":
        return <StartScreen onStart={startGame} />;
      case "gameOver":
        return <GameOverScreen score={score} highScore={highScore} onRestart={startGame} />;
      case "playing":
        return (
          <>
            <div className="absolute top-4 left-4 text-2xl font-headline text-accent z-10">SCORE: {score}</div>
            <div className="absolute top-4 right-4 text-2xl font-headline text-accent/80 z-10">HIGH SCORE: {highScore}</div>
            
            <motion.div style={{ position: 'absolute', left: C.PLAYER_X_POSITION, width: C.PLAYER_WIDTH, height: C.PLAYER_HEIGHT }} animate={{ y: playerPos.y }}>
              <NinjaIcon />
            </motion.div>

            {shurikens.map(s => (
              <div key={s.id} style={{ position: 'absolute', left: s.x, top: s.y, width: C.SHURIKEN_WIDTH, height: C.SHURIKEN_HEIGHT }}>
                <ShurikenIcon />
              </div>
            ))}
            
            <AnimatePresence>
            {enemies.map(e => (
               <motion.div 
                 key={e.id}
                 style={{ position: 'absolute', top: e.y, width: C.ENEMY_WIDTH, height: C.ENEMY_HEIGHT }}
                 initial={{ x: e.x, opacity: 1, scale: 1 }}
                 animate={{ x: e.x }}
                 exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
               >
                <EnemyIcon />
              </motion.div>
            ))}
            </AnimatePresence>

            {obstacles.map(o => (
              <div key={o.id} className="bg-primary/50 border-t-2 border-primary" style={{ position: 'absolute', left: o.x, top: o.y, width: o.width, height: o.height }} />
            ))}
            
            <div 
              className="absolute bottom-0 left-0 w-full bg-primary/30"
              style={{ height: C.GROUND_HEIGHT }}
            />
            <div className="absolute bottom-0 left-0 w-full h-10 bg-gradient-to-t from-background via-background/50 to-transparent" />
          </>
        );
    }
  };

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-background p-4 overflow-hidden">
        <h1 className="text-6xl font-headline text-primary mb-4 tracking-wider">Shadow Strike</h1>
        <div
            ref={gameContainerRef}
            className="relative bg-background w-full max-w-4xl border-2 border-primary/50 rounded-lg shadow-2xl shadow-primary/20 overflow-hidden"
            style={{ aspectRatio: `${C.GAME_WIDTH} / ${C.GAME_HEIGHT}` }}
        >
            {renderGameContent()}
        </div>
        {gameState === 'playing' && (
          <div className="flex gap-4 mt-4">
            <Button onClick={handleShoot} className="font-headline text-lg px-8 py-6">Shoot</Button>
            <Button onClick={handleJump} className="font-headline text-lg px-8 py-6">Jump</Button>
          </div>
        )}
        {gameState !== 'playing' && (
           <p className="text-accent/50 mt-4 text-sm font-code h-[52px]">
             Use the buttons to play the game.
           </p>
        )}
    </main>
  );
}

const StartScreen = ({ onStart }: { onStart: () => void }) => (
  <div className="w-full h-full flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm">
    <h2 className="text-5xl font-headline text-accent mb-8 animate-pulse">Ready?</h2>
    <Button onClick={onStart} size="lg" variant="destructive" className="bg-primary hover:bg-primary/80 font-headline text-2xl px-12 py-8 rounded-lg shadow-lg shadow-primary/30">
      Start Game
    </Button>
  </div>
);

const GameOverScreen = ({ score, highScore, onRestart }: { score: number, highScore: number, onRestart: () => void }) => (
  <motion.div 
    className="w-full h-full flex items-center justify-center bg-background/90 backdrop-blur-md"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ duration: 0.5 }}
  >
    <Card className="w-96 bg-secondary/80 border-primary shadow-2xl shadow-primary/20">
      <CardHeader>
        <CardTitle className="text-4xl font-headline text-center text-primary">Game Over</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4">
        <div className="text-center">
          <p className="text-accent text-lg">Your Score</p>
          <p className="text-5xl font-headline text-white">{score}</p>
        </div>
        <div className="text-center">
          <p className="text-accent/70 text-base">High Score</p>
          <p className="text-3xl font-headline text-accent">{highScore}</p>
        </div>
        <Button onClick={onRestart} size="lg" variant="destructive" className="mt-4 bg-primary hover:bg-primary/80 font-headline text-xl px-10 py-6">
          Restart
        </Button>
      </CardContent>
    </Card>
  </motion.div>
);

    