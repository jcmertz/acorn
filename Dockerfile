# Docker file for the project

# Use the official image as a parent image
FROM ubuntu:24.04
LABEL maintainer="The fun folks at the Fallen Log at Kitchen 17"

# Set the working directory
WORKDIR /app

# Copy the current directory contents into the container at /app
COPY . .

# Make sure we have the latest-n-greatest
RUN apt-get update; apt-get upgrade -y

# This is a node app so we gotta install node stuff
RUN apt-get install -y nodejs npm node-mongodb

# Install the dependencies
RUN npm install

# Run the app when the container launches
CMD ["node", "app.js"]

# For the database
ENV DBHOST=mongodb://acorn-mongo

# Expose the port the app runs on
EXPOSE 2554

# Done!

