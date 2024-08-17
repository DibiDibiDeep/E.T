import React from 'react';
import styles from './LandingPage2.module.css';

function LandingPage2() {
  return (
    <div className={styles.container}>
      <div className={styles.form}>
        <main>
          <h1 className={styles.title1}>Welcome to <br />Smileage</h1>
          <p>Earn mileage with every smile!</p>
          <div className={styles.buttons}>
            <button className={styles.primary}>Start Training</button>
          </div>
        </main>
      </div>
      <div className={styles.emoticonDisplay}>
        <img src='./img/3dimg2.png' alt="Emoticons" className={styles.emoticonImage} />
      </div>
    </div>
  );
}

export default LandingPage2;
