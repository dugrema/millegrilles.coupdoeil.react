pipeline {
    agent { label 'x86_64' }

    parameters {
        string(defaultValue: 'master', name: 'BRANCH')
        string(defaultValue: '2026.7', name: 'VERSION')
        string(defaultValue: 'jenkins-maple', name: 'CREDENTIALS_ID')
        string(defaultValue: 'ssh://git.maple.maceroc.com/git/millegrilles.coupdoeil.react', name: 'GIT_URL')
        string(defaultValue: 'coupdoeil', name: 'ARCHIVE_NAME')
    }

    environment {
        VBUILD = "${params.VERSION}.${BUILD_NUMBER}"
        ARCHIVE_NAME = "${params.ARCHIVE_NAME}"
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scmGit(branches: [[name: params.BRANCH]], extensions: [], userRemoteConfigs: [[credentialsId: params.CREDENTIALS_ID, url: params.GIT_URL]])
            }
        }

        stage('Build & Package & Deploy') {
            steps {
                sh '''
                export npm_config_registry=${NPM_REGISTRY}
                make deploy VERSION_FULL=${VBUILD} ARCHIVE_NAME=${ARCHIVE_NAME}
                '''
            }
        }

        stage('Deploy') {
            steps {
                sh "rsync artifacts/* ${DEPLOY_RSYNC_WEBAPP_DEST}/coupdoeil"
                sh "ssh fs1.maple.maceroc.com bin/catalogue.py update archives/dev.json --baseurl ${DEPLOY_ARCHIVE_URL}/coupdoeil --archive archives/coupdoeil/${ARCHIVE_NAME}.${VBUILD}.tar.gz"
            }
        }
    }

    post {
        success {
            archiveArtifacts artifacts: 'artifacts/', followSymlinks: false
        }
    }
}
