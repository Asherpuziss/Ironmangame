import React, { useState, useEffect, useRef } from 'react';
import { Pause, Play, ShoppingCart, X } from 'lucide-react';

export default function IronManGame() {
  const canvasRef = useRef(null);
  const [score, setScore] = useState(0);
  const [coins, setCoins] = useState(0);
  const [health, setHealth] = useState(100);
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [wave, setWave] = useState(1);
  const [enemiesInWave, setEnemiesInWave] = useState(0);
  const [enemiesKilled, setEnemiesKilled] = useState(0);
  const [paused, setPaused] = useState(false);
  const [showShop, setShowShop] = useState(false);
  const [showWaveTransition, setShowWaveTransition] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 400, y: 300 });
  const [currentSkin, setCurrentSkin] = useState('classic');
  const [ownedSkins, setOwnedSkins] = useState(['classic']);
  const [fireRate, setFireRate] = useState(200);
  const [maxHealth, setMaxHealth] = useState(100);
  const [projectileSize, setProjectileSize] = useState(6);
  
  const skins = {
    classic: { name: 'Mark III', price: 0, colors: { primary: '#dc2626', secondary: '#fbbf24' } },
    stealth: { name: 'Stealth', price: 50, colors: { primary: '#1f2937', secondary: '#6b7280' } },
    gold: { name: 'Golden Avenger', price: 100, colors: { primary: '#fbbf24', secondary: '#f59e0b' } },
    warmachine: { name: 'War Machine', price: 150, colors: { primary: '#374151', secondary: '#9ca3af' } },
    nanotech: { name: 'Nanotech', price: 200, colors: { primary: '#7c3aed', secondary: '#a78bfa' } }
  };
  
  const upgrades = {
    fireRate: [
      { level: 1, price: 30, value: 200 },
      { level: 2, price: 60, value: 150 },
      { level: 3, price: 100, value: 100 }
    ],
    health: [
      { level: 1, price: 40, value: 150 },
      { level: 2, price: 80, value: 200 },
      { level: 3, price: 120, value: 250 }
    ],
    projectileSize: [
      { level: 1, price: 50, value: 8 },
      { level: 2, price: 90, value: 10 },
      { level: 3, price: 130, value: 13 }
    ]
  };
  
  const gameState = useRef({
    ironMan: { x: 400, y: 300, size: 60, jetpackFlame: 0 },
    aliens: [],
    projectiles: [],
    explosions: [],
    particles: [],
    boss: null,
    bossProjectiles: [],
    lastShot: 0,
    lastAlienSpawn: 0,
    lastBossShot: 0,
    animationFrame: 0,
    fireRateLevel: 0,
    healthLevel: 0,
    projectileSizeLevel: 0
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !gameStarted) return;
    
    const ctx = canvas.getContext('2d');
    let animationId;

    const spawnAlien = () => {
      if (wave === 11) return; // No regular aliens during boss fight
      
      const enemiesPerWave = 5 + (wave * 2);
      if (enemiesInWave >= enemiesPerWave) return;
      
      const side = Math.floor(Math.random() * 4);
      let x, y;
      
      if (side === 0) {
        x = Math.random() * 800;
        y = -50;
      } else if (side === 1) {
        x = 850;
        y = Math.random() * 600;
      } else if (side === 2) {
        x = Math.random() * 800;
        y = 650;
      } else {
        x = -50;
        y = Math.random() * 600;
      }
      
      const angle = Math.atan2(gameState.current.ironMan.y - y, gameState.current.ironMan.x - x);
      const baseSpeed = 2.0 + Math.random() * 1.5;
      const speed = baseSpeed + (wave * 0.3);
      
      let color;
      if (wave === 1) {
        color = '#10b981';
      } else if (wave === 2) {
        color = '#3b82f6';
      } else if (wave === 3) {
        color = '#8b5cf6';
      } else if (wave === 4) {
        color = '#f59e0b';
      } else if (wave === 5) {
        color = '#ef4444';
      } else if (wave === 6) {
        color = '#ec4899';
      } else if (wave === 7) {
        color = '#06b6d4';
      } else if (wave === 8) {
        color = '#84cc16';
      } else if (wave === 9) {
        color = '#a855f7';
      } else {
        color = '#dc2626';
      }
      
      gameState.current.aliens.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 40,
        color: color
      });
      
      setEnemiesInWave(e => e + 1);
    };

    const spawnBoss = () => {
      gameState.current.boss = {
        x: 400,
        y: 100,
        size: 80,
        health: 100,
        maxHealth: 100,
        vx: 2
      };
    };

    const drawBoss = (boss) => {
      ctx.save();
      
      // Purple body
      ctx.fillStyle = '#7c3aed';
      ctx.beginPath();
      ctx.arc(boss.x, boss.y, boss.size, 0, Math.PI * 2);
      ctx.fill();
      
      // Gold armor chest
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.arc(boss.x, boss.y, boss.size * 0.7, Math.PI, 0);
      ctx.fill();
      
      // Head
      ctx.fillStyle = '#6d28d9';
      ctx.beginPath();
      ctx.arc(boss.x, boss.y - boss.size * 0.5, boss.size * 0.6, 0, Math.PI * 2);
      ctx.fill();
      
      // Eyes
      ctx.fillStyle = '#fbbf24';
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#fbbf24';
      ctx.fillRect(boss.x - 20, boss.y - boss.size * 0.6, 12, 8);
      ctx.fillRect(boss.x + 8, boss.y - boss.size * 0.6, 12, 8);
      ctx.shadowBlur = 0;
      
      // Infinity Gauntlet
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(boss.x - boss.size - 10, boss.y + 20, 30, 40);
      
      // Infinity Stones
      const stones = [
        { color: '#9333ea', x: 15, y: 10 },
        { color: '#ef4444', x: 5, y: 20 },
        { color: '#3b82f6', x: 25, y: 20 },
        { color: '#22c55e', x: 15, y: 30 }
      ];
      
      stones.forEach(stone => {
        ctx.fillStyle = stone.color;
        ctx.shadowBlur = 10;
        ctx.shadowColor = stone.color;
        ctx.beginPath();
        ctx.arc(boss.x - boss.size + stone.x, boss.y + 20 + stone.y, 5, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.shadowBlur = 0;
      
      ctx.restore();
    };

    const drawBossProjectile = (proj) => {
      ctx.shadowBlur = 20;
      ctx.shadowColor = proj.color;
      ctx.fillStyle = proj.color;
      ctx.beginPath();
      ctx.arc(proj.x, proj.y, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    };

    const createExplosion = (x, y) => {
      gameState.current.explosions.push({
        x, y,
        radius: 0,
        maxRadius: 50,
        alpha: 1
      });
      
      for (let i = 0; i < 15; i++) {
        const angle = (Math.PI * 2 * i) / 15;
        gameState.current.particles.push({
          x, y,
          vx: Math.cos(angle) * (2 + Math.random() * 3),
          vy: Math.sin(angle) * (2 + Math.random() * 3),
          life: 30,
          maxLife: 30,
          color: Math.random() > 0.5 ? '#fbbf24' : '#f97316'
        });
      }
    };

    const drawIronMan = (x, y, armAngle) => {
      const gs = gameState.current;
      const skin = skins[currentSkin];
      
      gs.jetpackFlame = (gs.jetpackFlame + 0.2) % (Math.PI * 2);
      const flameSize = 15 + Math.sin(gs.jetpackFlame) * 5;
      
      ctx.fillStyle = '#f97316';
      ctx.shadowBlur = 20;
      ctx.shadowColor = '#f97316';
      ctx.beginPath();
      ctx.moveTo(x - 15, y + 20);
      ctx.lineTo(x - 10, y + 20 + flameSize);
      ctx.lineTo(x - 5, y + 20);
      ctx.fill();
      
      ctx.beginPath();
      ctx.moveTo(x + 15, y + 20);
      ctx.lineTo(x + 10, y + 20 + flameSize);
      ctx.lineTo(x + 5, y + 20);
      ctx.fill();
      ctx.shadowBlur = 0;
      
      ctx.fillStyle = skin.colors.primary;
      ctx.fillRect(x - 12, y + 15, 8, 15);
      ctx.fillRect(x + 4, y + 15, 8, 15);
      
      ctx.fillStyle = skin.colors.primary;
      ctx.beginPath();
      ctx.arc(x, y, 28, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.fillStyle = skin.colors.secondary;
      ctx.beginPath();
      ctx.arc(x, y - 5, 18, 0, Math.PI);
      ctx.fill();
      
      const pulse = 8 + Math.sin(gs.animationFrame * 0.1) * 2;
      ctx.fillStyle = '#60a5fa';
      ctx.shadowBlur = 20;
      ctx.shadowColor = '#60a5fa';
      ctx.beginPath();
      ctx.arc(x, y, pulse, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.fillStyle = '#93c5fd';
      ctx.beginPath();
      ctx.arc(x, y, pulse - 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      
      ctx.fillStyle = skin.colors.primary;
      ctx.beginPath();
      ctx.arc(x, y - 22, 16, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.fillStyle = skin.colors.secondary;
      ctx.fillRect(x - 14, y - 26, 28, 12);
      
      ctx.fillStyle = '#60a5fa';
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#60a5fa';
      ctx.fillRect(x - 12, y - 24, 8, 6);
      ctx.fillRect(x + 4, y - 24, 8, 6);
      ctx.shadowBlur = 0;
      
      ctx.strokeStyle = skin.colors.primary;
      ctx.lineWidth = 10;
      ctx.lineCap = 'round';
      
      ctx.beginPath();
      ctx.moveTo(x - 20, y);
      ctx.lineTo(x - 35, y + 10);
      ctx.stroke();
      
      ctx.beginPath();
      ctx.moveTo(x + 20, y);
      const armLength = 40;
      ctx.lineTo(x + 20 + Math.cos(armAngle) * armLength, y + Math.sin(armAngle) * armLength);
      ctx.stroke();
      
      const repulsorX = x + 20 + Math.cos(armAngle) * armLength;
      const repulsorY = y + Math.sin(armAngle) * armLength;
      
      ctx.fillStyle = '#fbbf24';
      ctx.shadowBlur = 15;
      ctx.shadowColor = '#fbbf24';
      ctx.beginPath();
      ctx.arc(repulsorX, repulsorY, 6, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(repulsorX, repulsorY, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      
      ctx.fillStyle = 'rgba(251, 191, 36, 0.3)';
      ctx.beginPath();
      ctx.arc(x - 35, y + 10, 8, 0, Math.PI * 2);
      ctx.fill();
    };

    const drawAlien = (alien) => {
      ctx.save();
      ctx.translate(alien.x, alien.y);
      
      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.beginPath();
      ctx.ellipse(0, 15, alien.size * 0.8, alien.size * 0.2, 0, 0, Math.PI * 2);
      ctx.fill();
      
      const gradient = ctx.createLinearGradient(-alien.size, 0, alien.size, 0);
      gradient.addColorStop(0, '#4b5563');
      gradient.addColorStop(0.5, '#9ca3af');
      gradient.addColorStop(1, '#4b5563');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.ellipse(0, 0, alien.size, alien.size * 0.4, 0, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.strokeStyle = '#6b7280';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(0, 0, alien.size, alien.size * 0.4, 0, 0, Math.PI * 2);
      ctx.stroke();
      
      const domeGradient = ctx.createRadialGradient(0, -10, 0, 0, -10, alien.size * 0.5);
      domeGradient.addColorStop(0, alien.color);
      domeGradient.addColorStop(1, alien.color);
      ctx.fillStyle = domeGradient;
      ctx.beginPath();
      ctx.arc(0, -10, alien.size * 0.5, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.beginPath();
      ctx.arc(-5, -15, alien.size * 0.2, 0, Math.PI * 2);
      ctx.fill();
      
      const time = gameState.current.animationFrame * 0.1;
      for (let i = 0; i < 5; i++) {
        const angle = (i / 5) * Math.PI * 2 + time;
        const lx = Math.cos(angle) * alien.size * 0.7;
        const ly = Math.sin(angle) * alien.size * 0.3;
        
        ctx.fillStyle = alien.color;
        ctx.shadowBlur = 10;
        ctx.shadowColor = alien.color;
        ctx.beginPath();
        ctx.arc(lx, ly, 4, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.shadowBlur = 0;
      
      ctx.restore();
    };

    const drawCrosshair = (x, y) => {
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2;
      ctx.shadowBlur = 5;
      ctx.shadowColor = '#ef4444';
      
      ctx.beginPath();
      ctx.arc(x, y, 20, 0, Math.PI * 2);
      ctx.stroke();
      
      ctx.beginPath();
      ctx.moveTo(x - 30, y);
      ctx.lineTo(x - 12, y);
      ctx.moveTo(x + 30, y);
      ctx.lineTo(x + 12, y);
      ctx.moveTo(x, y - 30);
      ctx.lineTo(x, y - 12);
      ctx.moveTo(x, y + 30);
      ctx.lineTo(x, y + 12);
      ctx.stroke();
      
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(x, y, 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    };

    const gameLoop = (timestamp) => {
      if (paused || showShop || showWaveTransition) {
        animationId = requestAnimationFrame(gameLoop);
        return;
      }
      
      const gs = gameState.current;
      gs.animationFrame++;
      
      ctx.fillStyle = '#0c0a1f';
      ctx.fillRect(0, 0, 800, 600);
      
      ctx.fillStyle = '#fff';
      for (let i = 0; i < 50; i++) {
        const x = (i * 137) % 800;
        const y = (i * 211) % 600;
        ctx.fillRect(x, y, 2, 2);
      }
      
      // Boss fight
      if (wave === 11) {
        const gs = gameState.current;
        
        if (!gs.boss) {
          spawnBoss();
        }
        
        if (gs.boss) {
          gs.boss.x += gs.boss.vx;
          if (gs.boss.x > 700 || gs.boss.x < 100) {
            gs.boss.vx *= -1;
          }
          
          if (timestamp - gs.lastBossShot > 2000) {
            const colors = ['#9333ea', '#ef4444', '#3b82f6', '#22c55e', '#f59e0b', '#eab308'];
            const color = colors[Math.floor(Math.random() * colors.length)];
            const angle = Math.atan2(gs.ironMan.y - gs.boss.y, gs.ironMan.x - gs.boss.x);
            
            gs.bossProjectiles.push({
              x: gs.boss.x,
              y: gs.boss.y,
              vx: Math.cos(angle) * 3,
              vy: Math.sin(angle) * 3,
              color: color
            });
            
            gs.lastBossShot = timestamp;
          }
          
          drawBoss(gs.boss);
        }
        
        gs.bossProjectiles = gs.bossProjectiles.filter(proj => {
          proj.x += proj.vx;
          proj.y += proj.vy;
          
          let destroyed = false;
          gs.projectiles = gs.projectiles.filter(ironProj => {
            const dx = proj.x - ironProj.x;
            const dy = proj.y - ironProj.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist < 20) {
              destroyed = true;
              createExplosion(proj.x, proj.y);
              return false;
            }
            return true;
          });
          
          if (destroyed) return false;
          
          const dx = proj.x - gs.ironMan.x;
          const dy = proj.y - gs.ironMan.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          if (dist < 40) {
            setHealth(h => Math.max(0, h - 15));
            createExplosion(proj.x, proj.y);
            return false;
          }
          
          drawBossProjectile(proj);
          return proj.x > 0 && proj.x < 800 && proj.y > 0 && proj.y < 600;
        });
      }
      
      if (timestamp - gs.lastAlienSpawn > 1500 && wave !== 11) {
        spawnAlien();
        gs.lastAlienSpawn = timestamp;
      }
      
      if (enemiesInWave >= 5 + (wave * 2) && gs.aliens.length === 0 && wave !== 11) {
        setWave(w => w + 1);
        setEnemiesInWave(0);
        setEnemiesKilled(0);
        setShowWaveTransition(true);
        setTimeout(() => setShowWaveTransition(false), 2500);
      }
      
      if (wave === 11 && gs.boss && gs.boss.health <= 0) {
        setWave(w => w + 1);
        setEnemiesInWave(0);
        setEnemiesKilled(0);
        gs.boss = null;
        gs.bossProjectiles = [];
        setShowWaveTransition(true);
        setTimeout(() => setShowWaveTransition(false), 2500);
      }
      
      gs.explosions = gs.explosions.filter(exp => {
        exp.radius += 2;
        exp.alpha -= 0.05;
        
        ctx.globalAlpha = exp.alpha;
        ctx.fillStyle = '#f97316';
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#f97316';
        ctx.beginPath();
        ctx.arc(exp.x, exp.y, exp.radius, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.arc(exp.x, exp.y, exp.radius * 0.6, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
        
        return exp.alpha > 0;
      });
      
      gs.particles = gs.particles.filter(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.life--;
        
        ctx.globalAlpha = p.life / p.maxLife;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
        
        return p.life > 0;
      });
      
      gs.aliens = gs.aliens.filter(alien => {
        alien.x += alien.vx;
        alien.y += alien.vy;
        
        const dx = alien.x - gs.ironMan.x;
        const dy = alien.y - gs.ironMan.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < 50) {
          setHealth(h => Math.max(0, h - 10));
          createExplosion(alien.x, alien.y);
          return false;
        }
        
        drawAlien(alien);
        return alien.x > -100 && alien.x < 900 && alien.y > -100 && alien.y < 700;
      });
      
      gs.projectiles = gs.projectiles.filter(proj => {
        proj.x += proj.vx;
        proj.y += proj.vy;
        
        let hit = false;
        
        if (wave === 11 && gs.boss) {
          const dx = proj.x - gs.boss.x;
          const dy = proj.y - gs.boss.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          if (dist < gs.boss.size) {
            gs.boss.health--;
            hit = true;
            setScore(s => s + 50);
            createExplosion(proj.x, proj.y);
          }
        }
        
        gs.aliens = gs.aliens.filter(alien => {
          const dx = proj.x - alien.x;
          const dy = proj.y - alien.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          if (dist < alien.size) {
            hit = true;
            setScore(s => s + 100);
            setCoins(c => c + 1);
            setEnemiesKilled(k => k + 1);
            createExplosion(alien.x, alien.y);
            return false;
          }
          return true;
        });
        
        if (hit) return false;
        
        const projSize = projectileSize;
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#60a5fa';
        ctx.fillStyle = '#60a5fa';
        ctx.beginPath();
        ctx.arc(proj.x, proj.y, projSize, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#93c5fd';
        ctx.beginPath();
        ctx.arc(proj.x, proj.y, projSize / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        
        return proj.x > 0 && proj.x < 800 && proj.y > 0 && proj.y < 600;
      });
      
      const armAngle = Math.atan2(
        mousePos.y - gs.ironMan.y,
        mousePos.x - gs.ironMan.x
      );
      drawIronMan(gs.ironMan.x, gs.ironMan.y, armAngle);
      
      drawCrosshair(mousePos.x, mousePos.y);
      
      if (health <= 0 && !gameOver) {
        setGameOver(true);
      }
      
      if (!gameOver) {
        animationId = requestAnimationFrame(gameLoop);
      }
    };

    animationId = requestAnimationFrame(gameLoop);

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [mousePos, health, gameOver, paused, currentSkin, projectileSize, gameStarted, showShop, wave, enemiesInWave, showWaveTransition]);

  const handleMouseMove = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  const handleClick = () => {
    if (gameOver || paused || !gameStarted) return;
    
    const gs = gameState.current;
    const now = Date.now();
    
    if (now - gs.lastShot > fireRate) {
      const angle = Math.atan2(
        mousePos.y - gs.ironMan.y,
        mousePos.x - gs.ironMan.x
      );
      
      gs.projectiles.push({
        x: gs.ironMan.x + 20 + Math.cos(angle) * 40,
        y: gs.ironMan.y + Math.sin(angle) * 40,
        vx: Math.cos(angle) * 10,
        vy: Math.sin(angle) * 10
      });
      
      gs.lastShot = now;
    }
  };

  const resetGame = () => {
    setScore(0);
    setHealth(maxHealth);
    setGameOver(false);
    setPaused(false);
    setGameStarted(true);
    setWave(1);
    setEnemiesInWave(0);
    setEnemiesKilled(0);
    gameState.current = {
      ironMan: { x: 400, y: 300, size: 60, jetpackFlame: 0 },
      aliens: [],
      projectiles: [],
      explosions: [],
      particles: [],
      boss: null,
      bossProjectiles: [],
      lastShot: 0,
      lastAlienSpawn: 0,
      lastBossShot: 0,
      animationFrame: 0,
      fireRateLevel: gameState.current.fireRateLevel,
      healthLevel: gameState.current.healthLevel,
      projectileSizeLevel: gameState.current.projectileSizeLevel
    };
  };

  const startGame = () => {
    setGameStarted(true);
    setWave(1);
    setEnemiesInWave(0);
    setEnemiesKilled(0);
    setShowWaveTransition(true);
    setTimeout(() => setShowWaveTransition(false), 2500);
  };

  const buySkin = (skinKey) => {
    const skin = skins[skinKey];
    if (coins >= skin.price && !ownedSkins.includes(skinKey)) {
      setCoins(c => c - skin.price);
      setOwnedSkins([...ownedSkins, skinKey]);
      setCurrentSkin(skinKey);
    } else if (ownedSkins.includes(skinKey)) {
      setCurrentSkin(skinKey);
    }
  };

  const buyUpgrade = (type) => {
    const gs = gameState.current;
    let level;
    
    if (type === 'fireRate') {
      level = gs.fireRateLevel;
    } else if (type === 'health') {
      level = gs.healthLevel;
    } else if (type === 'projectileSize') {
      level = gs.projectileSizeLevel;
    }
    
    const upgrade = upgrades[type][level];
    
    if (upgrade && coins >= upgrade.price) {
      setCoins(c => c - upgrade.price);
      if (type === 'fireRate') {
        gs.fireRateLevel++;
        setFireRate(upgrade.value);
      } else if (type === 'health') {
        gs.healthLevel++;
        setMaxHealth(upgrade.value);
        setHealth(upgrade.value);
      } else if (type === 'projectileSize') {
        gs.projectileSizeLevel++;
        setProjectileSize(upgrade.value);
      }
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 p-4">
      {!gameStarted ? (
        <div className="flex flex-col items-center justify-center">
          <h1 className="text-6xl font-bold text-red-600 mb-4 animate-pulse">IRON MAN</h1>
          <h2 className="text-3xl font-bold text-white mb-8">ALIEN INVASION</h2>
          <button
            onClick={startGame}
            className="px-12 py-6 bg-gradient-to-r from-red-600 to-yellow-500 text-white rounded-lg font-bold text-3xl hover:from-red-700 hover:to-yellow-600 transition-all shadow-2xl transform hover:scale-105"
          >
            START GAME
          </button>
          <div className="mt-8 text-gray-400 text-center">
            <p className="text-xl">Defend Earth from waves of alien invaders!</p>
            <p className="mt-2">Move mouse to aim • Click to shoot</p>
          </div>
        </div>
      ) : (
        <div className="w-full flex flex-col items-center">
          {wave === 11 && gameState.current.boss && (
            <div className="w-full max-w-4xl mb-4 bg-gray-800 p-4 rounded-lg border-4 border-purple-600 shadow-2xl">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-2xl font-bold text-purple-400">⚡ THANOS - THE MAD TITAN</h3>
                <span className="text-xl text-white font-bold">{gameState.current.boss.health} / {gameState.current.boss.maxHealth}</span>
              </div>
              <div className="w-full bg-gray-900 rounded-full h-8 border-2 border-purple-500">
                <div 
                  className="bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 h-full rounded-full transition-all duration-300 flex items-center justify-center"
                  style={{ width: `${(gameState.current.boss.health / gameState.current.boss.maxHealth) * 100}%` }}
                >
                  <span className="text-white font-bold text-sm drop-shadow-lg">
                    {Math.round((gameState.current.boss.health / gameState.current.boss.maxHealth) * 100)}%
                  </span>
                </div>
              </div>
            </div>
          )}
          
          {showWaveTransition && (
            <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50">
              <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 text-white px-16 py-8 rounded-2xl shadow-2xl border-4 border-yellow-400 animate-pulse">
                <h2 className="text-6xl font-bold text-center mb-2">WAVE {wave}</h2>
                <p className="text-2xl text-center text-yellow-300">
                  {wave === 1 && "BEGIN!"}
                  {wave === 2 && "BLUE SQUADRON INCOMING!"}
                  {wave === 3 && "PURPLE FLEET DETECTED!"}
                  {wave === 4 && "ORANGE ARMADA APPROACHING!"}
                  {wave === 5 && "RED WARSHIPS DEPLOYED!"}
                  {wave === 6 && "PINK ELITE FORCES!"}
                  {wave === 7 && "CYAN ATTACKERS INCOMING!"}
                  {wave === 8 && "LIME INVASION FORCE!"}
                  {wave === 9 && "VIOLET COMMAND FLEET!"}
                  {wave === 10 && "CRIMSON DREADNOUGHTS!"}
                  {wave === 11 && "⚠️ BOSS: THANOS ⚠️"}
                  {wave > 11 && "VICTORY! CONTINUING..."}
                </p>
              </div>
            </div>
          )}
          
          <div className="mb-4 flex gap-4 text-white text-xl items-center flex-wrap justify-center">
            <div className="bg-gray-800 px-4 py-2 rounded-lg">Score: <span className="text-yellow-400 font-bold">{score}</span></div>
            <div className="bg-gray-800 px-4 py-2 rounded-lg">Coins: <span className="text-green-400 font-bold">💰 {coins}</span></div>
            <div className="bg-gray-800 px-4 py-2 rounded-lg">
              <span className="text-white">Wave: </span>
              <span className="text-purple-400 font-bold">{wave}</span>
            </div>
            <div className="bg-gray-800 px-4 py-2 rounded-lg">Health: <span className={health > 50 ? "text-green-400" : "text-red-400"}>{health}/{maxHealth}</span></div>
            <div className="bg-gray-800 px-4 py-2 rounded-lg">Enemies: <span className="text-orange-400">{wave === 11 ? `Boss` : `${enemiesKilled}/${5 + (wave * 2)}`}</span></div>
            <button
              onClick={() => setPaused(!paused)}
              className="p-2 bg-blue-600 rounded-lg hover:bg-blue-700"
            >
              {paused ? <Play size={20} /> : <Pause size={20} />}
            </button>
            <button
              onClick={() => setShowShop(true)}
              className="p-2 bg-purple-600 rounded-lg hover:bg-purple-700"
            >
              <ShoppingCart size={20} />
            </button>
          </div>
      
          <div className="relative">
            <canvas
              ref={canvasRef}
              width={800}
              height={600}
              onMouseMove={handleMouseMove}
              onClick={handleClick}
              className="border-4 border-red-600 rounded-lg cursor-crosshair"
            />
            
            {paused && !gameOver && (
              <div className="absolute inset-0 bg-black bg-opacity-70 flex items-center justify-center rounded-lg">
                <h2 className="text-4xl font-bold text-white">PAUSED</h2>
              </div>
            )}
            
            {gameOver && (
              <div className="absolute inset-0 bg-black bg-opacity-90 flex flex-col items-center justify-center rounded-lg">
                <h2 className="text-5xl font-bold text-red-500 mb-4">GAME OVER</h2>
                <p className="text-2xl text-white mb-2">Final Score: {score}</p>
                <p className="text-xl text-purple-400 mb-2">Final Wave: {wave}</p>
                <p className="text-xl text-green-400 mb-6">Total Coins: {coins}</p>
                <button
                  onClick={resetGame}
                  className="px-8 py-4 bg-red-600 text-white rounded-lg hover:bg-red-700 text-xl font-bold"
                >
                  RESTART
                </button>
              </div>
            )}
          </div>
          
          <div className="mt-4 text-gray-400 text-center">
            <p>Move mouse to aim • Click to shoot • Survive the waves!</p>
          </div>
        </div>
      )}

      {showShop && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowShop(false);
            }
          }}
        >
          <div className="bg-gradient-to-b from-gray-800 to-gray-900 rounded-2xl max-w-6xl w-full p-8 border-4 border-red-600 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-4xl font-bold text-red-500 mb-2">STARK INDUSTRIES SHOP</h2>
                <div className="text-yellow-400 text-2xl font-bold">💰 {coins} Coins Available</div>
              </div>
              <button
                onClick={() => setShowShop(false)}
                className="text-white hover:text-red-500 p-3 hover:bg-gray-700 rounded-lg transition-colors"
                type="button"
              >
                <X size={40} />
              </button>
            </div>
            
            <div className="grid grid-cols-3 gap-6">
              <div className="col-span-2">
                <h3 className="text-2xl font-bold text-white mb-4 border-b-2 border-red-500 pb-2">IRON MAN SUITS</h3>
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(skins).map(([key, skin]) => (
                    <div
                      key={key}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        currentSkin === key
                          ? 'border-green-500 bg-green-900/40 shadow-lg shadow-green-500/50'
                          : ownedSkins.includes(key)
                          ? 'border-blue-500 bg-blue-900/30'
                          : 'border-gray-600 bg-gray-700/50'
                      }`}
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div
                          className="w-12 h-12 rounded-lg shadow-lg"
                          style={{ backgroundColor: skin.colors.primary, border: `3px solid ${skin.colors.secondary}` }}
                        />
                        <div>
                          <h4 className="text-white font-bold text-lg">{skin.name}</h4>
                          <p className="text-gray-400 text-sm">
                            {skin.price === 0 ? 'Default Suit' : `${skin.price} coins`}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => buySkin(key)}
                        disabled={!ownedSkins.includes(key) && coins < skin.price}
                        type="button"
                        className={`w-full py-2 rounded-lg font-bold transition-all ${
                          currentSkin === key
                            ? 'bg-green-600 text-white shadow-lg'
                            : ownedSkins.includes(key)
                            ? 'bg-blue-600 hover:bg-blue-700 text-white'
                            : coins >= skin.price
                            ? 'bg-purple-600 hover:bg-purple-700 text-white'
                            : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        {currentSkin === key
                          ? '✓ EQUIPPED'
                          : ownedSkins.includes(key)
                          ? 'EQUIP'
                          : 'PURCHASE'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <h3 className="text-2xl font-bold text-white mb-4 border-b-2 border-red-500 pb-2">UPGRADES</h3>
                <div className="space-y-3">
                  <div className="p-3 bg-gradient-to-br from-orange-900/30 to-gray-700 rounded-lg border-2 border-orange-600">
                    <h4 className="text-white font-bold text-base mb-1">⚡ Fire Rate</h4>
                    <div className="mb-2">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-300">Level {gameState.current.fireRateLevel + 1}</span>
                        <span className="text-gray-300">Max 3</span>
                      </div>
                      <div className="w-full bg-gray-600 rounded-full h-1.5">
                        <div 
                          className="bg-orange-500 h-1.5 rounded-full transition-all"
                          style={{ width: `${((gameState.current.fireRateLevel + 1) / 3) * 100}%` }}
                        />
                      </div>
                    </div>
                    {gameState.current.fireRateLevel < 3 ? (
                      <button
                        onClick={() => buyUpgrade('fireRate')}
                        disabled={coins < upgrades.fireRate[gameState.current.fireRateLevel].price}
                        type="button"
                        className={`w-full py-1.5 rounded-lg text-sm font-bold transition-all ${
                          coins >= upgrades.fireRate[gameState.current.fireRateLevel].price
                            ? 'bg-orange-600 hover:bg-orange-700 text-white shadow-lg'
                            : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        {upgrades.fireRate[gameState.current.fireRateLevel].price} 💰
                      </button>
                    ) : (
                      <div className="text-green-400 text-center text-xs font-bold py-1.5 bg-green-900/30 rounded-lg">✓ MAX</div>
                    )}
                  </div>
                  
                  <div className="p-3 bg-gradient-to-br from-red-900/30 to-gray-700 rounded-lg border-2 border-red-600">
                    <h4 className="text-white font-bold text-base mb-1">❤️ Max Health</h4>
                    <div className="mb-2">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-300">Level {gameState.current.healthLevel + 1}</span>
                        <span className="text-gray-300">Max 3</span>
                      </div>
                      <div className="w-full bg-gray-600 rounded-full h-1.5">
                        <div 
                          className="bg-red-500 h-1.5 rounded-full transition-all"
                          style={{ width: `${((gameState.current.healthLevel + 1) / 3) * 100}%` }}
                        />
                      </div>
                    </div>
                    {gameState.current.healthLevel < 3 ? (
                      <button
                        onClick={() => buyUpgrade('health')}
                        disabled={coins < upgrades.health[gameState.current.healthLevel].price}
                        type="button"
                        className={`w-full py-1.5 rounded-lg text-sm font-bold transition-all ${
                          coins >= upgrades.health[gameState.current.healthLevel].price
                            ? 'bg-red-600 hover:bg-red-700 text-white shadow-lg'
                            : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        {upgrades.health[gameState.current.healthLevel].price} 💰
                      </button>
                    ) : (
                      <div className="text-green-400 text-center text-xs font-bold py-1.5 bg-green-900/30 rounded-lg">✓ MAX</div>
                    )}
                  </div>
                  
                  <div className="p-3 bg-gradient-to-br from-blue-900/30 to-gray-700 rounded-lg border-2 border-blue-600">
                    <h4 className="text-white font-bold text-base mb-1">🎯 Projectile Size</h4>
                    <div className="mb-2">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-300">Level {gameState.current.projectileSizeLevel + 1}</span>
                        <span className="text-gray-300">Max 3</span>
                      </div>
                      <div className="w-full bg-gray-600 rounded-full h-1.5">
                        <div 
                          className="bg-blue-500 h-1.5 rounded-full transition-all"
                          style={{ width: `${((gameState.current.projectileSizeLevel + 1) / 3) * 100}%` }}
                        />
                      </div>
                    </div>
                    {gameState.current.projectileSizeLevel < 3 ? (
                      <button
                        onClick={() => buyUpgrade('projectileSize')}
                        disabled={coins < upgrades.projectileSize[gameState.current.projectileSizeLevel].price}
                        type="button"
                        className={`w-full py-1.5 rounded-lg text-sm font-bold transition-all ${
                          coins >= upgrades.projectileSize[gameState.current.projectileSizeLevel].price
                            ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg'
                            : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        {upgrades.projectileSize[gameState.current.projectileSizeLevel].price} 💰
                      </button>
                    ) : (
                      <div className="text-green-400 text-center text-xs font-bold py-1.5 bg-green-900/30 rounded-lg">✓ MAX</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-6 pt-4 border-t-2 border-gray-700">
              <button
                onClick={() => setShowShop(false)}
                type="button"
                className="w-full py-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg font-bold text-xl transition-all shadow-lg"
              >
                RETURN TO BATTLE
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}