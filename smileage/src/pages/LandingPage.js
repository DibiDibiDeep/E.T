import React from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './LandingPage.module.css';

function LandingPage() {

const navigate = useNavigate();

  const handleClick = () => {
    navigate('/main'); // 버튼 클릭 시 '/main'으로 이동
  };

  return (
    <div className={styles.smileagePage}>
      <main>
        <h1 className={styles.title1}>Welcome to <br />Smileage</h1>
        <p>Earn mileages with every smile!</p>
        <div className={styles.buttons}>
          <button className={styles.primary} onClick={handleClick}>Start Training</button>
        </div>
      </main>
      {/* <div className={styles.flag}></div> */}
      <img src='./img/3dimg2.png' className={styles.flag} />
    </div>
  );
}

export default LandingPage;