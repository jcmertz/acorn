# Docker file for the project

# Use the official image as a parent image
FROM ubuntu:22.04
LABEL maintainer="The fun folks at the Fallen Log at Kitchen 17"

# Set up the environment variables
ENV TZ=America/Chicago
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

# Set the working directory
WORKDIR /app

# Copy the current directory contents into the container at /app
COPY . /app

# Make sure we have the latest-n-greatest
RUN apt-get update; apt-get upgrade -y

# This is a node app so we gotta install node stuff
RUN apt-get install -y nodejs npm node-mongodb

# Install the dependencies
RUN npm install

# Run the app when the container launches
CMD ["node", "index.js"]

# Expose the port the app runs on
EXPOSE 2554

# Done!

