class User < ActiveRecord::Base
    attr_accessible :name, :email
    validates :email,
        :presence => true,
        :uniqueness => { :case_sensitive => false }
    validates :name,
        :presence => true,
        :uniqueness => { :case_sensitive => false }
end
