FROM arhea/yarn:6

# set the working directory to our source root
WORKDIR /usr/src/app

# copy the package.json and yarn.lock file
COPY package.json /usr/src/app
COPY yarn.lock /usr/src/app

# install the dependencies
RUN yarn install

# copy source code
COPY . /usr/src/app

# replace this with your application's default port
EXPOSE 8888

CMD [ "yarn" , "run" ] 
#
