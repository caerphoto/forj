class User < ActiveRecord::Base
    has_many :posts
    has_many :msg_threads
    validates :email,
        :presence => true,
        :uniqueness => { :case_sensitive => false }
    validates :name,
        :presence => true,
        :uniqueness => { :case_sensitive => false }
end
