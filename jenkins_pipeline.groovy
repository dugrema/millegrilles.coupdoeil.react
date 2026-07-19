pipeline {
    agent { label 'x86_64' }

    parameters {
        string(defaultValue: 'master', name: 'BRANCH')
        string(defaultValue: '2026.1', name: 'VERSION')
        string(defaultValue: 'jenkins-maple', name: 'CREDENTIALS_ID')
        string(defaultValue: 'ssh://git.maple.maceroc.com/git/millegrilles.coupdoeil.react', name: 'GIT_URL')
        string(defaultValue: 'millegrilles_coupdoeil_react', name: 'ARCHIVE_NAME')
    }

    environment {
        VBUILD="${VERSION}.${BUILD_NUMBER}"
        ARCHIVE_NAME="${params.ARCHIVE_NAME}"
    }

    stages {

        stage('react build') {
            steps {
                echo 'Build react'

                checkout scmGit(branches: [[name: params.BRANCH]], extensions: [], userRemoteConfigs: [[credentialsId: params.CREDENTIALS_ID, url: params.GIT_URL]])

                sh '''
                # Creer manifest
                export DATECOURANTE=`date "+%Y-%m-%d %H:%M"`
                export PATH_MANIFEST=src/manifest.build.json

                echo "{" > $PATH_MANIFEST
                echo "\\"date\\": \\"$DATECOURANTE\\"," >> $PATH_MANIFEST
                echo "\\"version\\": \\"$VBUILD\\"" >> $PATH_MANIFEST
                echo "}" >> $PATH_MANIFEST

                echo "Manifest $PATH_MANIFEST"
                cat $PATH_MANIFEST
                '''

                sh '''
                echo Copier signed api mapping
                cp src/workers/apiMapping.signed.json src/workers/apiMapping.json
                '''

                sh '''
                export NODE_OPTIONS=--openssl-legacy-provider
                export CI=false

                echo "Env ---"
                printenv
                echo "---"

                npm i
                npm run build

                # gzip all resource files
                find build/ -type f \\( -name "*.js" -o -name "*.css" -o -name "*.map" -o -name "*.json" \\) -exec gzip -k {} \\;

                rm -r artifacts/ | true
                mkdir -p artifacts/
                tar -C build/ -zcf "artifacts/${ARCHIVE_NAME}.${VBUILD}.tar.gz" .

                . /var/lib/jenkins/venv_build2/bin/activate
                echo "Digest: "
                python3 /var/lib/jenkins/bin/runDigest.py "artifacts/${ARCHIVE_NAME}.${VBUILD}.tar.gz"
                '''

                archiveArtifacts artifacts: 'artifacts/', followSymlinks: false

                sh '''
                rsync artifacts/* fs1.maple.maceroc.com:archives/coupdoeil
                '''
            }
        }
    }
}
