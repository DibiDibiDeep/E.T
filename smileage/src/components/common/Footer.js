
import styles from './Footer.module.css'

function Footer(){

    return(
        <footer>
            <div className={styles.all}>
                <div className={styles.container}>
                    <div className={styles.containerBox}>
                        <a className={styles.leftText}>CopyrightⓒDibiDibiDeep</a>
                    </div>
                    <div className={styles.containerBox2}>
                    </div>
                </div>
            </div>  
        </footer>
    )
}

export default Footer;