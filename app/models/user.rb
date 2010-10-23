class User < ActiveRecord::Base
    has_many :posts
    attr_accessible :name, :email
    validates :email,
        :presence => true,
        :uniqueness => { :case_sensitive => false }
    validates :name,
        :presence => true,
        :uniqueness => { :case_sensitive => false }
end
