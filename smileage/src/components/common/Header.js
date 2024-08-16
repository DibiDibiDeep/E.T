import styles from 'styles/Header.module.css';

function Header() {
    return(
        <>
            <header className={styles.header}>
                <img src="/smile-logo.png" alt="logo" className={styles.logo} />
            </header>
        </>
    )
}

export default Header;
