# -*- mode: ruby -*-
# vi: set ft=ruby :

# Vagrantfile API/syntax version. Don't touch unless you know what you're doing!
VAGRANTFILE_API_VERSION = '2'

Vagrant.configure(VAGRANTFILE_API_VERSION) do |config|

  config.vm.box = 'ubuntu/trusty64'
  config.vm.network 'private_network', ip: '192.168.50.4'
  config.vm.network 'forwarded_port', guest: 80, host: 3000

  config.vm.provider 'virtualbox' do |v|
    v.memory = 2048
    v.cpus = 2
  end

  config.vm.provision "shell", inline: <<-SHELL

    wget -q -O - https://get.docker.io/gpg | apt-key add -
    echo deb http://get.docker.io/ubuntu docker main > /etc/apt/sources.list.d/docker.list
    apt-get update -qq
    apt-get install -q -y --force-yes linux-image-extra-$(uname -r)
    apt-get install -q -y --force-yes lxc-docker

    apt-get install -q -y --force-yes dnsmasq
    echo "address=/demo/127.0.0.1" >> /etc/dnsmasq.conf
    sed -i 's/^#\(prepend *domain-name-servers *127\.0\.0\.1\)/\1/' /etc/dhcp/dhclient.conf
    /etc/init.d/dnsmasq restart

    usermod -a -G docker vagrant
    echo "cd /vagrant" >> /home/vagrant/.bash_profile
  SHELL
end
